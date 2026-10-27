import * as THREE from "three";
import type { SceneMaterials } from "../fx/materials";
import { TOKENS } from "../styles/tokens";

const EARTH_RADIUS = 6_371_000;

export interface IntroPlanet {
  group: THREE.Group;
  setRange(range: number): void;
  setCamera(cameraPosition: THREE.Vector3): void;
  update(time: number): void;
  dispose(): void;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createStars(): THREE.Points {
  const count = 1800;
  const positions = new Float32Array(count * 3);
  const random = mulberry32(119);
  for (let i = 0; i < count; i += 1) {
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const radius = 5_200_000;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = radius * s * Math.cos(theta);
    positions[i * 3 + 1] = radius * u;
    positions[i * 3 + 2] = radius * s * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: new THREE.Color("#e6f7ff"),
    size: 2.8,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    depthTest: false,
    fog: false,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "intro-stars";
  points.renderOrder = -20;
  points.frustumCulled = false;
  return points;
}

function planetMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1 },
      uTime: { value: 0 },
      uPrimary: { value: new THREE.Color(TOKENS.colors.primary) },
      uOil: { value: new THREE.Color(TOKENS.colors.oil) },
    },
    vertexShader: `
      varying vec3 vPos;
      varying vec3 vNormalW;
      varying vec3 vViewW;
      void main() {
        vPos = normalize(position);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewW = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      uniform float uTime;
      uniform vec3 uPrimary;
      uniform vec3 uOil;
      varying vec3 vPos;
      varying vec3 vNormalW;
      varying vec3 vViewW;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
      }
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = hash(i);
        float n100 = hash(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash(i + vec3(1.0, 1.0, 1.0));
        return mix(
          mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
          mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
          f.z
        );
      }
      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.55;
        for (int i = 0; i < 4; i++) {
          value += noise(p) * amplitude;
          p *= 2.03;
          amplitude *= 0.48;
        }
        return value;
      }
      float gridLine(float coord, float stepSize) {
        float distanceToLine = abs(fract(coord / stepSize + 0.5) - 0.5) * stepSize;
        return 1.0 - smoothstep(0.0, 0.007, distanceToLine);
      }

      void main() {
        vec3 p = normalize(vPos);
        float elevation = fbm(p * 2.7 + vec3(1.7, -2.1, 0.6));
        float land = smoothstep(0.49, 0.56, elevation);
        float highland = smoothstep(0.61, 0.8, elevation);

        vec3 ocean = vec3(0.006, 0.028, 0.04);
        vec3 lowland = vec3(0.055, 0.135, 0.105);
        vec3 plateau = vec3(0.19, 0.16, 0.085);
        vec3 surface = mix(ocean, lowland, land);
        surface = mix(surface, plateau, highland * land);

        float coast = smoothstep(0.048, 0.0, abs(elevation - 0.53));
        surface += uPrimary * coast * 0.2;

        float lat = asin(clamp(p.y, -1.0, 1.0));
        float lon = atan(p.z, p.x);
        float grid = max(gridLine(lat, 0.1745), gridLine(lon, 0.1745));
        surface += uPrimary * grid * 0.038;

        float scan = smoothstep(0.035, 0.0, abs(fract(lat * 3.0 - uTime * 0.015) - 0.5));
        surface += uPrimary * scan * 0.035;

        float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewW)), 0.0), 2.8);
        surface += uPrimary * fres * 0.52;
        surface += uOil * fres * 0.05;

        gl_FragColor = vec4(surface, uOpacity);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
  });
}

export function createIntroPlanet(materials: SceneMaterials): IntroPlanet {
  const group = new THREE.Group();
  group.name = "intro-planet";
  const material = planetMaterial();
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 64);
  const planet = new THREE.Mesh(geometry, material);
  planet.position.y = -EARTH_RADIUS;
  planet.name = "holographic-earth";
  group.add(planet);

  const stars = createStars();
  group.add(stars);

  const marker = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: materials.glowSprite.map,
      color: new THREE.Color(TOKENS.colors.primary),
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  marker.position.set(0, 18_000, 0);
  marker.scale.setScalar(110_000);
  marker.name = "intro-field-marker";
  group.add(marker);

  const markerCore = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: materials.glowSprite.map,
      color: new THREE.Color(TOKENS.colors.oil),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  markerCore.position.set(0, 20_000, 0);
  markerCore.scale.setScalar(32_000);
  group.add(markerCore);

  let markerBase = 110_000;
  let coreBase = 32_000;

  const setRange = (range: number): void => {
    const visible = range > 105_000;
    group.visible = visible;
    if (!visible) return;
    const t = Math.min(1, Math.max(0, (range - 105_000) / 155_000));
    material.uniforms.uOpacity.value = t;
    (marker.material as THREE.SpriteMaterial).opacity = 0.82 * t;
    (markerCore.material as THREE.SpriteMaterial).opacity = 0.9 * t;
    (stars.material as THREE.PointsMaterial).opacity = 0.92 * t;
    markerBase = Math.max(18_000, range * 0.012);
    coreBase = Math.max(5_000, range * 0.0032);
  };

  return {
    group,
    setRange,
    setCamera: (cameraPosition: THREE.Vector3) => {
      stars.position.copy(cameraPosition);
    },
    update: (time: number) => {
      material.uniforms.uTime.value = time;
      stars.rotation.y = time * 0.003;
      const pulse = 1 + Math.sin(time * 1.4) * 0.08;
      marker.scale.setScalar(markerBase * pulse);
      markerCore.scale.setScalar(coreBase * (1 + Math.sin(time * 2.2) * 0.12));
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      stars.geometry.dispose();
      (stars.material as THREE.Material).dispose();
      (marker.material as THREE.Material).dispose();
      (markerCore.material as THREE.Material).dispose();
      group.removeFromParent();
    },
  };
}
