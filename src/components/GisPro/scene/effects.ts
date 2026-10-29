import * as THREE from "three";
import type { FeatureKind, FieldData, Pipeline, Station, Well } from "../data/types";
import type { ScenePalette } from "../styles/tokens";

export interface EffectsSystem {
  update(time: number): void;
  setSelection(kind: FeatureKind, id: string | null): void;
  triggerAlarm(id: string): void;
  clearAlarm(): void;
  applyTheme(palette: ScenePalette): void;
  dispose(): void;
}

interface SelectionTarget {
  x: number;
  z: number;
  y: number;
  radius: number;
  color: string;
}

function findTarget(
  field: FieldData,
  kind: FeatureKind,
  id: string,
  heightAt: (x: number, z: number) => number,
  palette: ScenePalette,
): SelectionTarget | null {
  if (kind === "well") {
    const well: Well | undefined = field.wells.find((item) => item.id === id);
    if (!well) return null;
    const color =
      well.status === "warning"
        ? palette.pipeMaintenance
        : well.status === "offline"
          ? palette.pipeStopped
          : palette.selection;
    return {
      x: well.pos.x,
      z: well.pos.z,
      y: heightAt(well.pos.x, well.pos.z) + 2,
      radius: 32,
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
      radius: 124,
      color: palette.selection,
    };
  }
  const pipeline: Pipeline | undefined = field.pipelines.find((item) => item.id === id);
  if (!pipeline) return null;
  const mid = pipeline.path[Math.floor(pipeline.path.length / 2)];
  const color =
    pipeline.status === "maintenance"
      ? palette.pipeMaintenance
      : pipeline.status === "stopped"
        ? palette.pipeStopped
        : pipeline.service === "producedWater"
          ? palette.pipeWater
          : palette.pipeGas;
  return {
    x: mid.x,
    z: mid.z,
    y: heightAt(mid.x, mid.z) + 5,
    radius: 28,
    color,
  };
}

function ringMesh(color: string): THREE.Mesh {
  const geometry = new THREE.RingGeometry(0.9, 1, 72);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function createEffects(
  field: FieldData,
  palette: ScenePalette,
  heightAt: (x: number, z: number) => number,
  surfaceParent: THREE.Object3D,
): EffectsSystem {
  let currentPalette = palette;
  const surfaceEffects = new THREE.Group();
  surfaceEffects.name = "surface-effects";
  surfaceParent.add(surfaceEffects);

  const selectionGroup = new THREE.Group();
  selectionGroup.name = "selection";
  selectionGroup.visible = false;
  const selectionRing = ringMesh(palette.selection);
  const selectionRingOuter = ringMesh(palette.selection);
  (selectionRingOuter.material as THREE.MeshBasicMaterial).opacity = 0.28;
  selectionGroup.add(selectionRing);
  selectionGroup.add(selectionRingOuter);
  surfaceEffects.add(selectionGroup);

  const alarmGroup = new THREE.Group();
  alarmGroup.name = "alarm-ring";
  alarmGroup.visible = false;
  const alarmRing = ringMesh(palette.alarm);
  (alarmRing.material as THREE.MeshBasicMaterial).opacity = 0.55;
  alarmGroup.add(alarmRing);
  surfaceEffects.add(alarmGroup);

  let selectionKind: FeatureKind | null = null;
  let selectionId: string | null = null;
  let selectionRadius = 1;
  let alarmRadius = 1;
  let alarmStart = -1;
  let alarmActive = false;

  const setSelection = (kind: FeatureKind, id: string | null): void => {
    selectionKind = kind;
    selectionId = id;
    if (!id) {
      selectionGroup.visible = false;
      return;
    }
    const target = findTarget(field, kind, id, heightAt, currentPalette);
    if (!target) {
      selectionGroup.visible = false;
      return;
    }
    selectionRadius = target.radius;
    selectionGroup.position.set(target.x, target.y, target.z);
    selectionRing.scale.setScalar(target.radius);
    selectionRingOuter.scale.setScalar(target.radius * 1.28);
    (selectionRing.material as THREE.MeshBasicMaterial).color.set(target.color);
    (selectionRingOuter.material as THREE.MeshBasicMaterial).color.set(target.color);
    selectionGroup.visible = true;
  };

  const triggerAlarm = (id: string): void => {
    const target =
      findTarget(field, "well", id, heightAt, currentPalette) ??
      findTarget(field, "station", id, heightAt, currentPalette) ??
      findTarget(field, "pipeline", id, heightAt, currentPalette);
    if (!target) return;
    alarmGroup.position.set(target.x, target.y, target.z);
    alarmRadius = target.radius;
    alarmRing.scale.setScalar(target.radius);
    (alarmRing.material as THREE.MeshBasicMaterial).color.set(currentPalette.alarm);
    alarmGroup.visible = true;
    alarmStart = -1;
    alarmActive = true;
  };

  const clearAlarm = (): void => {
    alarmActive = false;
    alarmGroup.visible = false;
  };

  const update = (time: number): void => {
    if (!alarmActive) return;
    if (alarmStart < 0) alarmStart = time;
    const progress = ((time - alarmStart) % 1.6) / 1.6;
    alarmRing.scale.setScalar(alarmRadius * (1 + progress * 0.3));
    (alarmRing.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.5;
  };

  const applyTheme = (next: ScenePalette): void => {
    currentPalette = next;
    if (selectionKind && selectionId) setSelection(selectionKind, selectionId);
    (alarmRing.material as THREE.MeshBasicMaterial).color.set(next.alarm);
  };

  return {
    update,
    setSelection,
    triggerAlarm,
    clearAlarm,
    applyTheme,
    dispose: () => {
      surfaceEffects.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      surfaceEffects.removeFromParent();
    },
  };
}
