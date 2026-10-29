import * as THREE from "three";
import type { ScenePalette } from "../styles/tokens";

export interface SceneMaterials {
  steel: THREE.MeshStandardMaterial;
  steelDark: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  building: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  road: THREE.MeshStandardMaterial;
  tank: THREE.MeshStandardMaterial;
  sulfur: THREE.MeshStandardMaterial;
  pipeGas: THREE.MeshBasicMaterial;
  pipeWater: THREE.MeshBasicMaterial;
  pipeSelected: THREE.MeshBasicMaterial;
  pipeMaintenance: THREE.MeshBasicMaterial;
  pipeStopped: THREE.MeshBasicMaterial;
  selection: THREE.MeshBasicMaterial;
  alarm: THREE.MeshBasicMaterial;
  applyTheme(palette: ScenePalette): void;
  dispose(): void;
}

function standard(
  color: string,
  roughness: number,
  metalness: number,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
  });
}

export function createSceneMaterials(palette: ScenePalette): SceneMaterials {
  const steel = standard(palette.steel, 0.42, 0.4);
  const steelDark = standard(palette.steelDark, 0.5, 0.45);
  const concrete = standard(palette.concrete, 0.95, 0.02);
  const building = standard(palette.building, 0.8, 0.05);
  const roof = standard(palette.roof, 0.7, 0.08);
  const road = standard(palette.road, 0.95, 0.02);
  const tank = standard(palette.tank, 0.38, 0.5);
  const sulfur = standard(palette.sulfur, 0.62, 0.18);
  // 管线用不受光的纯色材质：颜色在任何底图和光照下保持一致，像制图线而非金属管。
  const pipeGas = new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.pipeGas) });
  const pipeWater = new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.pipeWater) });
  const pipeSelected = new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.pipeSelected) });
  const pipeMaintenance = new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.pipeMaintenance),
  });
  const pipeStopped = new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.pipeStopped) });

  const selection = new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.selection),
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const alarm = new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.alarm),
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const applyTheme = (next: ScenePalette): void => {
    steel.color.set(next.steel);
    steelDark.color.set(next.steelDark);
    concrete.color.set(next.concrete);
    building.color.set(next.building);
    roof.color.set(next.roof);
    road.color.set(next.road);
    tank.color.set(next.tank);
    sulfur.color.set(next.sulfur);
    pipeGas.color.set(next.pipeGas);
    pipeWater.color.set(next.pipeWater);
    pipeSelected.color.set(next.pipeSelected);
    pipeMaintenance.color.set(next.pipeMaintenance);
    pipeStopped.color.set(next.pipeStopped);
    selection.color.set(next.selection);
    alarm.color.set(next.alarm);
  };

  const allMaterials = [
    steel,
    steelDark,
    concrete,
    building,
    roof,
    road,
    tank,
    sulfur,
    pipeGas,
    pipeWater,
    pipeSelected,
    pipeMaintenance,
    pipeStopped,
    selection,
    alarm,
  ];

  return {
    steel,
    steelDark,
    concrete,
    building,
    roof,
    road,
    tank,
    sulfur,
    pipeGas,
    pipeWater,
    pipeSelected,
    pipeMaintenance,
    pipeStopped,
    selection,
    alarm,
    applyTheme,
    dispose: () => {
      allMaterials.forEach((material) => material.dispose());
    },
  };
}

/** Cesium 中心点标记：纯色细环 + 圆点，不做发光。 */
export function createMarkerDataUrl(color = "#0B6E99"): string {
  const size = 128;
  const element = document.createElement("canvas");
  element.width = size;
  element.height = size;
  const ctx = element.getContext("2d");
  if (!ctx) return "";
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  return element.toDataURL("image/png");
}
