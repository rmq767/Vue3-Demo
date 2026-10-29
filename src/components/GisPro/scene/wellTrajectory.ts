import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { FieldData, Well } from "../data/types";
import { RESERVOIRS, STRATA } from "../data/reservoir";
import type { ScenePalette } from "../styles/tokens";

export interface WellTrajectoryView {
  group: THREE.Group;
  open(well: Well): void;
  close(): void;
  update(time: number): void;
  applyTheme(palette: ScenePalette): void;
  dispose(): void;
}

const SECTION_MIN_WIDTH = 1400;
const SECTION_MAX_WIDTH = 3200;
const SECTION_DEPTH = 420;
const MIN_DEPTH = 1600;
const SURFACE_Y = 0;

function sectionWidthFor(well: Well): number {
  return Math.max(
    SECTION_MIN_WIDTH,
    Math.min(SECTION_MAX_WIDTH, well.lateralLength * 2 + 500),
  );
}

function disposeGroup(group: THREE.Group): void {
  group.traverse((object) => {
    const label = object as THREE.Object3D & {
      isCSS2DObject?: boolean;
      element?: HTMLElement;
    };
    if (label.isCSS2DObject) {
      label.element?.remove();
      return;
    }
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material?.dispose();
  });
  group.clear();
}

function createSectionLabel(
  text: string,
  sub: string,
  x: number,
  y: number,
  z: number,
  align: "left" | "right",
  tone = "",
): CSS2DObject {
  const element = document.createElement("div");
  element.className = `af-section-label${tone ? ` ${tone}` : ""}`;
  const title = document.createElement("strong");
  title.textContent = text;
  const meta = document.createElement("span");
  meta.textContent = sub;
  element.append(title, meta);
  const object = new CSS2DObject(element);
  object.position.set(x, y, z);
  object.center.set(align === "right" ? 0 : 1, 0.5);
  return object;
}

function reservoirColor(key: string, palette: ScenePalette): string {
  if (key === "gas") return palette.pipeGas;
  if (key === "sulfur") return palette.sulfur;
  if (key === "info") return palette.pipeWater;
  return palette.selection;
}

function buildStrataBlock(well: Well, depth: number, palette: ScenePalette): THREE.Group {
  const group = new THREE.Group();
  const sectionWidth = sectionWidthFor(well);
  const topMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.concrete),
    roughness: 0.96,
    metalness: 0.02,
  });
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(sectionWidth + 40, 18, SECTION_DEPTH + 40),
    topMaterial,
  );
  top.position.set(well.pos.x, SURFACE_Y, well.pos.z);
  top.receiveShadow = true;
  group.add(top);

  STRATA.forEach((layer) => {
    const topY = SURFACE_Y - layer.from * depth;
    const bottomY = SURFACE_Y - layer.to * depth;
    const height = Math.max(8, topY - bottomY);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(layer.color),
      roughness: 0.92,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sectionWidth, height, SECTION_DEPTH),
      material,
    );
    mesh.position.set(well.pos.x, (topY + bottomY) / 2, well.pos.z);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);

    group.add(
      createSectionLabel(
        layer.name,
        `${Math.round(layer.from * depth)}–${Math.round(layer.to * depth)} m`,
        well.pos.x - sectionWidth / 2 - 46,
        (topY + bottomY) / 2,
        well.pos.z + SECTION_DEPTH / 2 + 12,
        "right",
      ),
    );
  });

  const reservoir = RESERVOIRS.find((item) => item.id === well.reservoirId) ?? RESERVOIRS[0];
  RESERVOIRS.forEach((item) => {
    const topDepth = Math.min(depth - 12, item.topDepth);
    const bottomDepth = Math.min(depth - 8, item.bottomDepth);
    if (topDepth >= bottomDepth) return;
    const highlight = item.id === reservoir.id;
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(reservoirColor(item.colorKey, palette)),
      transparent: true,
      opacity: highlight ? 0.3 : 0.12,
      depthWrite: false,
    });
    const band = new THREE.Mesh(
      new THREE.PlaneGeometry(sectionWidth - 4, bottomDepth - topDepth),
      material,
    );
    band.position.set(
      well.pos.x,
      SURFACE_Y - (topDepth + bottomDepth) / 2,
      well.pos.z + SECTION_DEPTH / 2 + 2.5,
    );
    band.name = `trajectory-reservoir-${item.id}`;
    group.add(band);

    if (highlight) {
      group.add(
        createSectionLabel(
          item.name,
          `${item.topDepth}–${item.bottomDepth} m`,
          well.pos.x + sectionWidth / 2 + 46,
          SURFACE_Y - (topDepth + bottomDepth) / 2,
          well.pos.z + SECTION_DEPTH / 2 + 12,
          "left",
          "is-reservoir",
        ),
      );
    }
  });

  return group;
}

function buildWellPath(well: Well, depth: number, palette: ScenePalette): THREE.Group {
  const group = new THREE.Group();
  const frontZ = well.pos.z + SECTION_DEPTH / 2 + 8;
  const reservoir = RESERVOIRS.find((item) => item.id === well.reservoirId) ?? RESERVOIRS[0];
  const sectionWidth = sectionWidthFor(well);
  const reservoirTop = Math.min(depth - 20, reservoir.topDepth);
  const reservoirBottom = Math.min(depth - 12, reservoir.bottomDepth);
  // 剖面只沿 x 轴展开水平段，避免方位角朝向镜头时把轨迹压成一条直线。
  const lateralLength =
    well.lateralLength > 0 ? Math.min(well.lateralLength, sectionWidth / 2 - 220) : 0;
  const start = new THREE.Vector3(well.pos.x, SURFACE_Y, frontZ);
  const kickoff = new THREE.Vector3(
    well.pos.x,
    SURFACE_Y - Math.max(220, reservoirTop * 0.7),
    frontZ,
  );
  const build = new THREE.Vector3(
    well.pos.x + lateralLength * 0.22,
    SURFACE_Y - reservoirTop,
    frontZ,
  );
  const end = new THREE.Vector3(
    well.pos.x + lateralLength,
    SURFACE_Y - Math.max(reservoirBottom, reservoirTop + 30),
    frontZ,
  );

  const totalDepthY = SURFACE_Y - Math.min(depth, well.depth);
  const points =
    lateralLength > 0
      ? [start, kickoff, build, end]
      : [start, kickoff, new THREE.Vector3(well.pos.x, totalDepthY, frontZ)];
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 80, 4.2, 6, false);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.pipeMaintenance),
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const tube = new THREE.Mesh(geometry, material);
  group.add(tube);

  const casingGeometry = new THREE.TubeGeometry(curve, 80, 7.5, 6, false);
  const casingMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(palette.selection),
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  const casing = new THREE.Mesh(casingGeometry, casingMaterial);
  group.add(casing);

  const perforations: THREE.Vector3[] = [];
  const count = 7;
  const perforationStart = lateralLength > 0 ? 0.8 : 0.7;
  for (let i = 0; i < count; i += 1) {
    const t = perforationStart + (i / count) * 0.16;
    perforations.push(curve.getPoint(t));
  }
  const pointsGeometry = new THREE.BufferGeometry().setFromPoints(perforations);
  const pointsMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(palette.pipeMaintenance),
    size: 8,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
  group.add(pointsMesh);

  const wellhead = new THREE.Group();
  const headBase = new THREE.Mesh(
    new THREE.CylinderGeometry(18, 24, 24, 12),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.steel),
      roughness: 0.55,
      metalness: 0.4,
    }),
  );
  headBase.position.set(well.pos.x, SURFACE_Y + 12, frontZ);
  wellhead.add(headBase);
  const headTop = new THREE.Mesh(
    new THREE.BoxGeometry(34, 10, 34),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.pipeMaintenance),
      roughness: 0.6,
      metalness: 0.2,
    }),
  );
  headTop.position.set(well.pos.x, SURFACE_Y + 28, frontZ);
  wellhead.add(headTop);
  group.add(wellhead);

  const labelX = well.pos.x - sectionWidth / 2 - 46;
  group.add(
    createSectionLabel(
      "井口",
      "0 m",
      labelX,
      SURFACE_Y,
      frontZ + 12,
      "right",
      "is-well-end",
    ),
  );
  group.add(
    createSectionLabel(
      "井底",
      `${Math.round(well.depth)} m`,
      labelX,
      totalDepthY,
      frontZ + 12,
      "right",
      "is-well-end",
    ),
  );

  return group;
}

export function createWellTrajectory(
  field: FieldData,
  palette: ScenePalette,
): WellTrajectoryView {
  const group = new THREE.Group();
  group.name = "well-trajectory";
  group.visible = false;
  let content: THREE.Group | null = null;
  let currentPalette = palette;
  let currentWell: Well | null = null;

  const clear = (): void => {
    if (!content) return;
    disposeGroup(content);
    group.remove(content);
    content = null;
  };

  const open = (well: Well): void => {
    currentWell = well;
    clear();
    content = new THREE.Group();
    const depth = Math.max(MIN_DEPTH, Math.ceil((well.depth + 180) / 100) * 100);
    content.add(buildStrataBlock(well, depth, currentPalette));
    content.add(buildWellPath(well, depth, currentPalette));
    group.add(content);
    group.visible = true;
    content.traverse((object) => {
      if ((object as unknown as { isCSS2DObject?: boolean }).isCSS2DObject) {
        object.visible = true;
      }
    });
  };

  return {
    group,
    open,
    close: () => {
      group.visible = false;
      content?.traverse((object) => {
        if ((object as unknown as { isCSS2DObject?: boolean }).isCSS2DObject) {
          object.visible = false;
        }
      });
    },
    update: () => {
      // 静态井轨迹，不再叠加发光粒子。
    },
    applyTheme: (next: ScenePalette) => {
      currentPalette = next;
      if (currentWell && group.visible) open(currentWell);
    },
    dispose: () => {
      clear();
      group.removeFromParent();
    },
  };
}
