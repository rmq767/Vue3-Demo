import * as THREE from "three";
import type { FieldData } from "../data/types";
import type { SceneMaterials } from "../fx/materials";
import { TOKENS } from "../styles/tokens";

export const DIORAMA_ALT = 800;
export const CORE_RADIUS = 1850;
export const CORE_THICKNESS = 520;
export const SECTOR_START = -Math.PI / 4;
export const SECTOR_LENGTH = Math.PI * 1.5;

export interface TerrainSlice {
  group: THREE.Group;
  surfaceGroup: THREE.Group;
  coreGroup: THREE.Group;
  heightAt(x: number, z: number): number;
  update(time: number, underground: number): void;
  dispose(): void;
}

function hash(x: number, z: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm(x: number, z: number): number {
  let value = 0;
  let amplitude = 0.5;
  for (let i = 0; i < 4; i += 1) {
    value += valueNoise(x, z) * amplitude;
    x *= 2.03;
    z *= 2.01;
    amplitude *= 0.5;
  }
  return value;
}

function heightAt(x: number, z: number): number {
  const base = (fbm(x * 0.0016 + 8.2, z * 0.0016 - 3.7) - 0.5) * 34;
  const detail = (fbm(x * 0.008 - 2.4, z * 0.008 + 6.1) - 0.5) * 6;
  return base + detail;
}

function buildStrataTexture(field: FieldData): THREE.DataTexture {
  const strata = field.strata;
  const data = new Uint8Array(strata.length * 4);
  const color = new THREE.Color();
  strata.forEach((layer, index) => {
    color.set(layer.color).convertSRGBToLinear();
    data[index * 4] = Math.round(color.r * 255);
    data[index * 4 + 1] = Math.round(color.g * 255);
    data[index * 4 + 2] = Math.round(color.b * 255);
    data[index * 4 + 3] = 255;
  });
  const texture = new THREE.DataTexture(data, strata.length, 1, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function boundaryPoint(angle: number, radius: number): { x: number; z: number } {
  return { x: Math.cos(angle) * radius, z: -Math.sin(angle) * radius };
}

function wallGeometry(radius: number, innerRadius: number, thickness: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const depths: number[] = [];
  const pushQuad = (
    a: { x: number; z: number },
    b: { x: number; z: number },
  ): void => {
    const topA = heightAt(a.x, a.z);
    const topB = heightAt(b.x, b.z);
    // 两个三角形组成一个垂直墙面
    positions.push(a.x, topA, a.z, a.x, topA - thickness, a.z, b.x, topB, b.z);
    depths.push(0, 1, 0);
    positions.push(a.x, topA - thickness, a.z, b.x, topB - thickness, b.z, b.x, topB, b.z);
    depths.push(1, 1, 0);
  };

  const arcSegments = 180;
  for (let i = 0; i < arcSegments; i += 1) {
    const angleA = SECTOR_START + (SECTOR_LENGTH * i) / arcSegments;
    const angleB = SECTOR_START + (SECTOR_LENGTH * (i + 1)) / arcSegments;
    pushQuad(boundaryPoint(angleA, radius), boundaryPoint(angleB, radius));
  }

  const radialSegments = 18;
  for (const angle of [SECTOR_START, SECTOR_START + SECTOR_LENGTH]) {
    for (let i = 0; i < radialSegments; i += 1) {
      const rA = radius - ((radius - innerRadius) * i) / radialSegments;
      const rB = radius - ((radius - innerRadius) * (i + 1)) / radialSegments;
      const a = boundaryPoint(angle, rA);
      const b = boundaryPoint(angle, rB);
      if (angle === SECTOR_START) pushQuad(a, b);
      else pushQuad(b, a);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aDepth", new THREE.Float32BufferAttribute(depths, 1));
  geometry.computeVertexNormals();
  return geometry;
}

function wallMaterial(
  field: FieldData,
  materials: SceneMaterials,
): { material: THREE.ShaderMaterial; strataTexture: THREE.DataTexture } {
  const strataTexture = buildStrataTexture(field);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uStrata: { value: strataTexture },
      uNoise: { value: materials.noise },
      uUnderground: { value: 0 },
      uTime: { value: 0 },
      uEdgeColor: { value: new THREE.Color(TOKENS.colors.primary) },
    },
    vertexShader: `
      attribute float aDepth;
      varying float vDepth;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      varying vec3 vViewW;
      void main() {
        vDepth = aDepth;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewW = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform sampler2D uStrata;
      uniform sampler2D uNoise;
      uniform float uUnderground;
      uniform float uTime;
      uniform vec3 uEdgeColor;
      varying float vDepth;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      varying vec3 vViewW;
      void main() {
        float t = clamp(vDepth, 0.0, 0.9999);
        vec3 col = texture2D(uStrata, vec2(t, 0.5)).rgb;
        float n = texture2D(uNoise, vWorld.xz * 0.0024 + vWorld.y * 0.008).r;
        col *= 0.94 + n * 0.3;

        // 层理暗线 + 极细青色分层线
        float layerLine = abs(fract(t * 9.0) - 0.5);
        col *= mix(0.66, 1.0, smoothstep(0.46, 0.5, layerLine));
        float seam = smoothstep(0.492, 0.5, layerLine);
        col += uEdgeColor * seam * 0.09;

        // 薄层高光，地下模式增强
        float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewW)), 0.0), 2.0);
        col += uEdgeColor * fres * (0.16 + uUnderground * 0.22);

        // 油藏深度带：原油 / 天然气 / 深层
        float oilBand = smoothstep(0.055, 0.0, abs(t - 0.25));
        float gasBand = smoothstep(0.05, 0.0, abs(t - 0.57));
        float deepBand = smoothstep(0.05, 0.0, abs(t - 0.82));
        col += vec3(1.0, 0.54, 0.12) * oilBand * (0.16 + uUnderground * 0.28);
        col += vec3(0.29, 0.94, 0.78) * gasBand * (0.12 + uUnderground * 0.24);
        col += vec3(0.58, 0.54, 1.0) * deepBand * (0.11 + uUnderground * 0.22);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
  });
  return { material, strataTexture };
}

function arcPoints(radius: number, yOffset = 0, count = 180): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= count; i += 1) {
    const angle = SECTOR_START + (SECTOR_LENGTH * i) / count;
    const point = boundaryPoint(angle, radius);
    points.push(new THREE.Vector3(point.x, heightAt(point.x, point.z) + yOffset, point.z));
  }
  return points;
}

function lineFromPoints(
  points: THREE.Vector3[],
  material: THREE.LineBasicMaterial,
  closed = false,
): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    closed ? [...points, points[0]] : points,
  );
  return new THREE.Line(geometry, material);
}

function buildTopMesh(radius: number, innerRadius: number, materials: SceneMaterials): THREE.Mesh {
  const geometry = new THREE.RingGeometry(
    innerRadius,
    radius,
    220,
    56,
    SECTOR_START,
    SECTOR_LENGTH,
  );
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const y = heightAt(x, z);
    position.setY(i, y);
    const shade = 0.84 + Math.min(0.26, Math.max(0, (y + 22) / 70));
    color.setRGB(shade, shade * 0.94, shade * 0.78);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  position.needsUpdate = true;
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, materials.sand);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = "core-top";
  return mesh;
}

function buildTerrainGrid(geometry: THREE.BufferGeometry): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(TOKENS.colors.primary) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vWorld;
      void main() {
        float gx = min(fract(vWorld.x / 80.0), 1.0 - fract(vWorld.x / 80.0));
        float gz = min(fract(vWorld.z / 80.0), 1.0 - fract(vWorld.z / 80.0));
        float line = 1.0 - smoothstep(0.0, 0.02, min(gx, gz));
        float radius = length(vWorld.xz) / 1850.0;
        float fade = smoothstep(1.0, 0.52, radius);
        float scan = smoothstep(0.02, 0.0, abs(fract((vWorld.x + vWorld.z) / 900.0 - uTime * 0.012) - 0.5));
        float alpha = (line * 0.06 + scan * 0.08) * fade;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.layers.set(1);
  mesh.name = "terrain-grid";
  return mesh;
}

function buildBlockRings(field: FieldData): THREE.Group {
  const group = new THREE.Group();
  group.name = "block-rings";
  const colors = TOKENS.colors as Record<string, string>;
  field.blocks.forEach((block) => {
    const points: THREE.Vector3[] = [];
    const count = 72;
    for (let i = 0; i <= count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const x = block.center.x + Math.cos(angle) * block.radius;
      const z = block.center.z + Math.sin(angle) * block.radius;
      points.push(new THREE.Vector3(x, heightAt(x, z) + 4, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: new THREE.Color(colors[block.colorKey] ?? TOKENS.colors.primary),
      transparent: true,
      opacity: 0.28,
      dashSize: 18,
      gapSize: 14,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    group.add(line);
  });
  return group;
}

function buildRimTicks(radius: number, materials: SceneMaterials): THREE.InstancedMesh {
  const count = 72;
  const geometry = new THREE.BoxGeometry(0.7, 0.45, 9);
  const tickMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(TOKENS.colors.primary),
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geometry, tickMaterial, count);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const radial = new THREE.Vector3();
  for (let i = 0; i < count; i += 1) {
    const angle = SECTOR_START + (SECTOR_LENGTH * i) / (count - 1);
    const point = boundaryPoint(angle, radius + 8);
    position.set(point.x, heightAt(point.x, point.z) + 3, point.z);
    radial.set(Math.cos(angle), 0, -Math.sin(angle)).normalize();
    quaternion.setFromUnitVectors(zAxis, radial);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.layers.set(1);
  mesh.name = "rim-ticks";
  return mesh;
}

function buildScanRing(radius: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(
    radius * 0.78,
    radius * 0.94,
    180,
    1,
    SECTOR_START,
    SECTOR_LENGTH,
  );
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(TOKENS.colors.primary) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vPos;
      void main() {
        float angle = atan(vPos.z, vPos.x);
        float sweep = smoothstep(0.35, 1.0, sin(angle * 2.4 + uTime * 0.9));
        float radial = smoothstep(0.0, 0.25, abs(length(vPos.xz) / 1850.0 - 0.86) * 20.0);
        float alpha = (1.0 - radial) * (0.018 + sweep * 0.065);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 34;
  mesh.layers.set(1);
  mesh.name = "scan-ring";
  return mesh;
}

function buildGroundShadow(radius: number, materials: SceneMaterials): THREE.Mesh {
  const geometry = new THREE.CircleGeometry(radius * 1.32, 96);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, materials.shadow);
  mesh.position.y = -DIORAMA_ALT + 1;
  mesh.renderOrder = 1;
  mesh.name = "ground-shadow";
  return mesh;
}

function buildGroundGlow(radius: number, materials: SceneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.position.y = -DIORAMA_ALT + 4;
  group.name = "ground-glow";

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 1.32, 96).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: materials.glowSprite.map,
      color: new THREE.Color(TOKENS.colors.primary),
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  pool.layers.set(1);
  group.add(pool);

  const warm = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.52, 80).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: materials.glowSprite.map,
      color: new THREE.Color(TOKENS.colors.oil),
      transparent: true,
      opacity: 0.028,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  warm.position.y = 0.5;
  warm.position.x = 120;
  warm.layers.set(1);
  group.add(warm);
  return group;
}

function buildGroundRings(radius: number, materials: SceneMaterials): THREE.Group {
  const group = new THREE.Group();
  group.position.y = -DIORAMA_ALT + 2;
  const ringA = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.9, radius * 1.24, 160),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(TOKENS.colors.primary),
      transparent: true,
      opacity: 0.035,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  ringA.rotation.x = -Math.PI / 2;
  ringA.layers.set(1);
  group.add(ringA);
  const ringB = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.34, radius * 1.37, 160),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(TOKENS.colors.primary),
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  ringB.rotation.x = -Math.PI / 2;
  ringB.layers.set(1);
  group.add(ringB);
  group.name = "ground-rings";
  return group;
}

function buildBeams(radius: number): THREE.Group {
  const group = new THREE.Group();
  group.name = "ground-beams";
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(TOKENS.colors.primary),
    transparent: true,
    opacity: 0.07,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.CylinderGeometry(2, 90, 280, 4, 1, true);
  const count = 8;
  for (let i = 0; i < count; i += 1) {
    const angle = SECTOR_START + (SECTOR_LENGTH * (i + 0.5)) / count;
    const point = boundaryPoint(angle, radius * 0.76);
    const beam = new THREE.Mesh(geometry, material);
    beam.position.set(point.x, -CORE_THICKNESS - 140, point.z);
    beam.layers.set(1);
    group.add(beam);
  }
  return group;
}

export function createTerrainSlice(
  field: FieldData,
  materials: SceneMaterials,
): TerrainSlice {
  const group = new THREE.Group();
  group.position.y = DIORAMA_ALT;
  group.name = "diorama";

  const coreGroup = new THREE.Group();
  coreGroup.name = "core";
  const surfaceGroup = new THREE.Group();
  surfaceGroup.name = "surface";

  const top = buildTopMesh(CORE_RADIUS, 0.5, materials);
  surfaceGroup.add(top);

  const wall = wallGeometry(CORE_RADIUS, 0.5, CORE_THICKNESS);
  const wallMat = wallMaterial(field, materials);
  const wallMesh = new THREE.Mesh(wall, wallMat.material);
  wallMesh.name = "strata-wall";
  coreGroup.add(wallMesh);

  const bottom = new THREE.Mesh(
    new THREE.RingGeometry(0.5, CORE_RADIUS, 180, 1, SECTOR_START, SECTOR_LENGTH).rotateX(
      -Math.PI / 2,
    ),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(TOKENS.colors.void),
      side: THREE.DoubleSide,
    }),
  );
  bottom.position.y = -CORE_THICKNESS;
  bottom.name = "core-bottom";
  coreGroup.add(bottom);

  const topEdgeMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(TOKENS.colors.primary),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const outerArc = arcPoints(CORE_RADIUS, 1.5, 200);
  const startEdgePoints: THREE.Vector3[] = [];
  const endEdgePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 22; i += 1) {
    const r = CORE_RADIUS - (CORE_RADIUS - 0.5) * (i / 22);
    const a = boundaryPoint(SECTOR_START, r);
    const b = boundaryPoint(SECTOR_START + SECTOR_LENGTH, r);
    startEdgePoints.push(new THREE.Vector3(a.x, heightAt(a.x, a.z) + 1.5, a.z));
    endEdgePoints.push(new THREE.Vector3(b.x, heightAt(b.x, b.z) + 1.5, b.z));
  }
  const edgePoints = [...startEdgePoints, ...outerArc, ...endEdgePoints.reverse()];
  const edgeLine = lineFromPoints(edgePoints, topEdgeMaterial);
  surfaceGroup.add(edgeLine);

  group.add(coreGroup);
  group.add(surfaceGroup);
  group.add(buildGroundShadow(CORE_RADIUS, materials));
  group.add(buildGroundGlow(CORE_RADIUS, materials));

  const update = (time: number, underground: number): void => {
    surfaceGroup.position.y = underground * 220;
    wallMat.material.uniforms.uUnderground.value = underground;
    wallMat.material.uniforms.uTime.value = time;
  };

  return {
    group,
    surfaceGroup,
    coreGroup,
    heightAt,
    update,
    dispose: () => {
      wallMat.strataTexture.dispose();
      wallMat.material.dispose();
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
    },
  };
}
