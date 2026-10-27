import * as THREE from "three";
import type { FieldData, Medium, Pipeline } from "../data/types";
import type { SceneMaterials } from "../fx/materials";
import { TOKENS } from "../styles/tokens";

export interface PipelineSystem {
  group: THREE.Group;
  arcGroup: THREE.Group;
  pickables: THREE.Object3D[];
  update(time: number): void;
  refresh(field: FieldData): void;
  setSelected(id: string | null): void;
  dispose(): void;
}

function mediumColor(medium: Medium, status: Pipeline["status"]): THREE.Color {
  if (status === "maintenance") return new THREE.Color(TOKENS.colors.warning);
  if (status === "stopped") return new THREE.Color(TOKENS.colors.inkMuted);
  if (medium === "gas") return new THREE.Color(TOKENS.colors.gas);
  if (medium === "water") return new THREE.Color(TOKENS.colors.water);
  return new THREE.Color(TOKENS.colors.oil);
}

function flowMaterial(color: THREE.Color, speed: number, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color.clone() },
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uOpacity: { value: opacity },
      uSelected: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewW;
      void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewW = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uOpacity;
      uniform float uSelected;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewW;
      void main() {
        float phase = vUv.x * 76.0 - uTime * uSpeed;
        float band = smoothstep(0.22, 0.98, sin(phase * 6.28318) * 0.5 + 0.5);
        float pulse = pow(band, 3.0);
        float core = smoothstep(0.5, 0.98, sin(phase * 6.28318 + 2.0) * 0.5 + 0.5);
        float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewW)), 0.0), 2.0);
        vec3 col = uColor * (0.2 + pulse * 1.35 + core * 0.42 + uSelected * 0.32);
        col += vec3(0.55, 0.95, 1.0) * fres * (0.035 + uSelected * 0.08);
        float alpha = uOpacity * (0.1 + pulse * 0.7 + core * 0.12 + uSelected * 0.2);
        alpha += fres * 0.04;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function buildArcMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return flowMaterial(color, 0.55, 0.34);
}

export function createPipelineSystem(
  field: FieldData,
  materials: SceneMaterials,
  heightAt: (x: number, z: number) => number,
): PipelineSystem {
  const group = new THREE.Group();
  group.name = "pipelines";
  const arcGroup = new THREE.Group();
  arcGroup.name = "data-arcs";
  arcGroup.visible = false;
  const pickables: THREE.Object3D[] = [];
  const flows: {
    pipeline: Pipeline;
    material: THREE.ShaderMaterial;
    glow: THREE.Mesh;
    baseSpeed: number;
  }[] = [];
  const arcs: { material: THREE.ShaderMaterial; baseSpeed: number }[] = [];
  let selectedId: string | null = null;

  for (const pipeline of field.pipelines) {
    const points = pipeline.path.map(
      (point) => new THREE.Vector3(point.x, heightAt(point.x, point.z) + 4.2, point.z),
    );
    const curve = new THREE.CatmullRomCurve3(points);
    const solidGeometry = new THREE.TubeGeometry(curve, 56, 0.85, 6, false);
    const solid = new THREE.Mesh(solidGeometry, materials.pipe);
    solid.castShadow = true;
    solid.name = pipeline.id;
    solid.userData.id = pipeline.id;
    solid.userData.kind = "pipeline";
    group.add(solid);
    pickables.push(solid);

    const color = mediumColor(pipeline.medium, pipeline.status);
    const glowGeometry = new THREE.TubeGeometry(curve, 56, 3.4, 6, false);
    const material = flowMaterial(
      color,
      Math.max(0.18, pipeline.flow / 260),
      pipeline.status === "running" ? 0.44 : 0.16,
    );
    const glow = new THREE.Mesh(glowGeometry, material);
    glow.layers.set(1);
    glow.name = `${pipeline.id}-flow`;
    glow.visible = false;
    group.add(glow);
    flows.push({
      pipeline,
      material,
      glow,
      baseSpeed: material.uniforms.uSpeed.value,
    });
  }

  const arcWells = field.wells.filter((_, index) => index % 5 === 1);
  const arcColors = [TOKENS.colors.primary, TOKENS.colors.gas, TOKENS.colors.info];
  arcWells.forEach((well, index) => {
    const station = field.stations.find((item) => item.id === well.stationId) ?? field.stations[0];
    const from = new THREE.Vector3(well.pos.x, heightAt(well.pos.x, well.pos.z) + 22, well.pos.z);
    const to = new THREE.Vector3(
      station.pos.x,
      heightAt(station.pos.x, station.pos.z) + 80,
      station.pos.z,
    );
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += 130 + (index % 3) * 55;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const geometry = new THREE.TubeGeometry(curve, 32, 0.9, 4, false);
    const material = buildArcMaterial(new THREE.Color(arcColors[index % arcColors.length]));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.layers.set(1);
    mesh.name = `arc-${well.id}`;
    arcGroup.add(mesh);
    arcs.push({ material, baseSpeed: material.uniforms.uSpeed.value });
  });

  group.add(arcGroup);

  const refresh = (data: FieldData): void => {
    for (const flow of flows) {
      const latest = data.pipelines.find((item) => item.id === flow.pipeline.id);
      if (!latest) continue;
      const color = mediumColor(latest.medium, latest.status);
      flow.material.uniforms.uColor.value.copy(color);
      flow.material.uniforms.uSpeed.value =
        latest.status === "running" ? Math.max(0.18, latest.flow / 260) : 0.06;
      flow.material.uniforms.uOpacity.value = latest.status === "running" ? 0.62 : 0.16;
      flow.material.uniforms.uSelected.value = latest.id === selectedId ? 1 : 0;
      flow.glow.visible = latest.id === selectedId;
    }
  };

  const update = (time: number): void => {
    for (const flow of flows) {
      flow.material.uniforms.uTime.value = time;
    }
    for (const arc of arcs) {
      arc.material.uniforms.uTime.value = time;
    }
  };

  return {
    group,
    arcGroup,
    pickables,
    update,
    refresh,
    setSelected: (id: string | null) => {
      selectedId = id;
      for (const flow of flows) {
        flow.material.uniforms.uSelected.value = flow.pipeline.id === id ? 1 : 0;
        flow.glow.visible = id !== null && flow.pipeline.id === id;
      }
    },
    dispose: () => {
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
    },
  };
}
