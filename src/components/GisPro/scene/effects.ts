import * as THREE from "three";
import type { FeatureKind, FieldData, Pipeline, Station, Well } from "../data/types";
import type { SceneMaterials } from "../fx/materials";
import { TOKENS } from "../styles/tokens";

export interface EffectsSystem {
  update(time: number): void;
  setSelection(kind: FeatureKind, id: string | null): void;
  triggerAlarm(id: string): void;
  clearAlarm(): void;
  dispose(): void;
}

interface SelectionTarget {
  x: number;
  z: number;
  y: number;
  radius: number;
  height: number;
  color: THREE.Color;
}

function findTarget(
  field: FieldData,
  kind: FeatureKind,
  id: string,
  heightAt: (x: number, z: number) => number,
): SelectionTarget | null {
  if (kind === "well") {
    const well: Well | undefined = field.wells.find((item) => item.id === id);
    if (!well) return null;
    const color =
      well.status === "warning"
        ? new THREE.Color(TOKENS.colors.warning)
        : well.status === "offline"
          ? new THREE.Color(TOKENS.colors.inkMuted)
          : new THREE.Color(TOKENS.colors.primary);
    return {
      x: well.pos.x,
      z: well.pos.z,
      y: heightAt(well.pos.x, well.pos.z) + 2,
      radius: 30,
      height: 90,
      color,
    };
  }
  if (kind === "station") {
    const station: Station | undefined = field.stations.find((item) => item.id === id);
    if (!station) return null;
    return {
      x: station.pos.x,
      z: station.pos.z,
      y: heightAt(station.pos.x, station.pos.z) + 2,
      radius: 96,
      height: 130,
      color: new THREE.Color(TOKENS.colors.primary),
    };
  }
  const pipeline: Pipeline | undefined = field.pipelines.find((item) => item.id === id);
  if (!pipeline) return null;
  const mid = pipeline.path[Math.floor(pipeline.path.length / 2)];
  const color =
    pipeline.medium === "gas"
      ? TOKENS.colors.gas
      : pipeline.medium === "water"
        ? TOKENS.colors.water
        : TOKENS.colors.oil;
  return {
    x: mid.x,
    z: mid.z,
    y: heightAt(mid.x, mid.z) + 4,
    radius: 24,
    height: 48,
    color: new THREE.Color(color),
  };
}

function ringMesh(radius: number, color: THREE.Color): THREE.Mesh {
  const geometry = new THREE.RingGeometry(0.88, 1, 80);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.setScalar(radius);
  mesh.layers.set(1);
  return mesh;
}

function beamMesh(color: THREE.Color): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(0.45, 0.9, 1, 6, 1, true);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.layers.set(1);
  return mesh;
}

export function createEffects(
  field: FieldData,
  materials: SceneMaterials,
  heightAt: (x: number, z: number) => number,
  surfaceParent: THREE.Object3D,
  scene: THREE.Scene,
): EffectsSystem {
  const surfaceEffects = new THREE.Group();
  surfaceEffects.name = "surface-effects";
  surfaceParent.add(surfaceEffects);

  const selectionGroup = new THREE.Group();
  selectionGroup.name = "selection";
  selectionGroup.visible = false;
  const selectionRing = ringMesh(1, new THREE.Color(TOKENS.colors.primary));
  const selectionRingOuter = ringMesh(1.35, new THREE.Color(TOKENS.colors.primary));
  (selectionRingOuter.material as THREE.MeshBasicMaterial).opacity = 0.22;
  const selectionBeam = beamMesh(new THREE.Color(TOKENS.colors.primary));
  selectionGroup.add(selectionRing);
  selectionGroup.add(selectionRingOuter);
  selectionGroup.add(selectionBeam);
  surfaceEffects.add(selectionGroup);

  const alarmGroup = new THREE.Group();
  alarmGroup.name = "alarm-ring";
  alarmGroup.visible = false;
  const alarmRing = ringMesh(1, new THREE.Color(TOKENS.colors.danger));
  const alarmRingOuter = ringMesh(1.55, new THREE.Color(TOKENS.colors.danger));
  (alarmRingOuter.material as THREE.MeshBasicMaterial).opacity = 0.3;
  const alarmBeam = beamMesh(new THREE.Color(TOKENS.colors.danger));
  alarmGroup.add(alarmRing);
  alarmGroup.add(alarmRingOuter);
  alarmGroup.add(alarmBeam);
  surfaceEffects.add(alarmGroup);

  let selectionRadius = 1;
  let selectionHeight = 1;
  let selectionTarget: SelectionTarget | null = null;
  let alarmRadius = 1;
  let alarmStart = -1;
  let alarmActive = false;

  const setSelection = (kind: FeatureKind, id: string | null): void => {
    if (!id) {
      selectionTarget = null;
      selectionGroup.visible = false;
      return;
    }
    const target = findTarget(field, kind, id, heightAt);
    if (!target) {
      selectionGroup.visible = false;
      return;
    }
    selectionTarget = target;
    selectionRadius = target.radius;
    selectionHeight = target.height;
    selectionGroup.position.set(target.x, target.y, target.z);
    selectionRing.scale.setScalar(target.radius);
    selectionRingOuter.scale.setScalar(target.radius * 1.38);
    (selectionRing.material as THREE.MeshBasicMaterial).color.copy(target.color);
    (selectionRingOuter.material as THREE.MeshBasicMaterial).color.copy(target.color);
    const beamMaterial = selectionBeam.material as THREE.MeshBasicMaterial;
    beamMaterial.color.copy(target.color);
    selectionBeam.scale.set(1, target.height, 1);
    selectionBeam.position.y = target.height / 2;
    selectionGroup.visible = true;
  };

  const triggerAlarm = (id: string): void => {
    const target =
      findTarget(field, "well", id, heightAt) ??
      findTarget(field, "station", id, heightAt) ??
      findTarget(field, "pipeline", id, heightAt);
    if (!target) return;
    alarmGroup.position.set(target.x, target.y, target.z);
    alarmRadius = target.radius;
    alarmRing.scale.setScalar(target.radius * 1.1);
    alarmRingOuter.scale.setScalar(target.radius * 1.5);
    alarmBeam.scale.set(1, target.height * 1.15, 1);
    alarmBeam.position.y = (target.height * 1.15) / 2;
    alarmGroup.visible = true;
    alarmStart = -1;
    alarmActive = true;
  };

  const clearAlarm = (): void => {
    alarmActive = false;
    alarmGroup.visible = false;
  };

  // 沙尘：地表一层 + 沙盘上沿一层，不参与拾取
  const dustPositions: number[] = [];
  let seed = 431;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 360; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 280 + random() * 1750;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = random() < 0.58 ? 20 + random() * 340 : 810 + random() * 200;
    dustPositions.push(x, y, z);
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(dustPositions, 3),
  );
  const dustMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(TOKENS.colors.primary),
    size: 3.2,
    map: materials.glowSprite.map,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.name = "dust";
  dust.layers.set(1);
  scene.add(dust);

  // 远处的极光带：只在总览/远景出现，不参与交互
  const auroraGeometry = new THREE.PlaneGeometry(26000, 5400, 1, 1);
  const auroraMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(TOKENS.colors.success) },
      uColorB: { value: new THREE.Color(TOKENS.colors.violet) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec2 vUv;
      void main() {
        float curtain = sin(vUv.x * 21.0 + uTime * 0.18) * 0.5 + 0.5;
        curtain *= sin(vUv.x * 7.0 - uTime * 0.09 + 1.2) * 0.5 + 0.5;
        float vertical = smoothstep(0.0, 0.72, vUv.y) * smoothstep(1.0, 0.62, vUv.y);
        float alpha = curtain * vertical * 0.1;
        vec3 col = mix(uColorA, uColorB, vUv.x * 0.75 + sin(uTime * 0.1) * 0.15);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const aurora = new THREE.Mesh(auroraGeometry, auroraMaterial);
  aurora.position.set(0, 3000, -16000);
  aurora.layers.set(1);
  aurora.name = "aurora";
  scene.add(aurora);

  const update = (time: number): void => {
    if (selectionGroup.visible) {
      const pulse = 1 + Math.sin(time * 2.4) * 0.035;
      selectionRing.scale.setScalar(selectionRadius * pulse);
      selectionRingOuter.scale.setScalar(selectionRadius * 1.38 * pulse);
      selectionRing.rotation.z = time * 0.22;
      selectionRingOuter.rotation.z = -time * 0.14;
      const beam = selectionBeam.material as THREE.MeshBasicMaterial;
      beam.opacity = 0.08 + Math.sin(time * 2.1) * 0.025;
      if (selectionTarget) {
        selectionBeam.scale.y = selectionHeight;
      }
    }

    if (alarmActive) {
      if (alarmStart < 0) alarmStart = time;
      const progress = (time - alarmStart) % 1.6 / 1.6;
      const scale = 1 + progress * 5.2;
      alarmRing.scale.setScalar(alarmRadius * scale);
      alarmRingOuter.scale.setScalar(alarmRadius * scale * 1.4);
      (alarmRing.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.55;
      (alarmRingOuter.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.24;
      const beam = alarmBeam.material as THREE.MeshBasicMaterial;
      beam.opacity = 0.2 + Math.sin(time * 5.4) * 0.08;
      alarmGroup.rotation.y = time * 0.18;
    }

    dust.rotation.y = time * 0.008;
    dust.position.y = Math.sin(time * 0.22) * 8;
    auroraMaterial.uniforms.uTime.value = time;
  };

  return {
    update,
    setSelection,
    triggerAlarm,
    clearAlarm,
    dispose: () => {
      [surfaceEffects, dust, aurora].forEach((object) => {
        object.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const material = mesh.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material?.dispose();
        });
        object.removeFromParent();
      });
    },
  };
}
