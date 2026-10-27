import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { FieldData, Well } from "../data/types";
import { RESERVOIRS, STRATA } from "../data/reservoir";
import type { SceneMaterials } from "../fx/materials";
import { TOKENS } from "../styles/tokens";

export interface WellTrajectoryView {
  group: THREE.Group;
  open(well: Well): void;
  close(): void;
  update(time: number): void;
  dispose(): void;
}

const SECTION_WIDTH = 1100;
const SECTION_DEPTH = 420;
const MIN_DEPTH = 1600;
const SECTION_LIFT = 200;

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

function buildStrataBlock(well: Well, depth: number, materials: SceneMaterials): THREE.Group {
  const group = new THREE.Group();
  const topMaterial = new THREE.MeshStandardMaterial({
    map: materials.sand.map,
    color: new THREE.Color(0xb7a27b),
    roughness: 0.96,
    metalness: 0.02,
  });
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(SECTION_WIDTH + 40, 18, SECTION_DEPTH + 40),
    topMaterial,
  );
  top.position.set(well.pos.x, SECTION_LIFT + depth, well.pos.z);
  top.receiveShadow = true;
  group.add(top);

  STRATA.forEach((layer) => {
    const topY = SECTION_LIFT + (1 - layer.from) * depth;
    const bottomY = SECTION_LIFT + (1 - layer.to) * depth;
    const height = Math.max(8, topY - bottomY);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(layer.color),
      roughness: 0.92,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(SECTION_WIDTH, height, SECTION_DEPTH),
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
        well.pos.x - SECTION_WIDTH / 2 - 46,
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
      color: new THREE.Color(
        (TOKENS.colors as Record<string, string>)[item.colorKey] ?? TOKENS.colors.oil,
      ),
      transparent: true,
      opacity: highlight ? 0.42 : 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const band = new THREE.Mesh(
      new THREE.PlaneGeometry(SECTION_WIDTH - 4, bottomDepth - topDepth),
      material,
    );
    band.position.set(
      well.pos.x,
      SECTION_LIFT + depth - (topDepth + bottomDepth) / 2,
      well.pos.z + SECTION_DEPTH / 2 + 2.5,
    );
    band.name = `trajectory-reservoir-${item.id}`;
    group.add(band);

    if (highlight) {
      group.add(
        createSectionLabel(
          item.name,
          `${item.topDepth}–${item.bottomDepth} m`,
          well.pos.x + SECTION_WIDTH / 2 + 46,
          SECTION_LIFT + depth - (topDepth + bottomDepth) / 2,
          well.pos.z + SECTION_DEPTH / 2 + 12,
          "left",
          "is-reservoir",
        ),
      );
    }
  });

  return group;
}

function buildWellPath(well: Well, depth: number): THREE.Group {
  const group = new THREE.Group();
  const frontZ = well.pos.z + SECTION_DEPTH / 2 + 8;
  const reservoir = RESERVOIRS.find((item) => item.id === well.reservoirId) ?? RESERVOIRS[0];
  const reservoirTop = Math.min(depth - 20, reservoir.topDepth);
  const reservoirBottom = Math.min(depth - 12, reservoir.bottomDepth);
  const lateral = well.lateralLength;
  const lateralLength = lateral > 0 ? Math.max(260, lateral) : 0;
  const dx = Math.cos(well.azimuth) * lateralLength;
  const dz = Math.sin(well.azimuth) * lateralLength;
  const start = new THREE.Vector3(well.pos.x, SECTION_LIFT + depth + 8, frontZ);
  const kickoff = new THREE.Vector3(
    well.pos.x,
    SECTION_LIFT + depth - Math.max(220, reservoirTop * 0.78),
    frontZ,
  );
  const build = new THREE.Vector3(
    well.pos.x + dx * 0.2,
    SECTION_LIFT + depth - reservoirTop,
    frontZ + dz * 0.2,
  );
  const end = new THREE.Vector3(
    well.pos.x + dx,
    SECTION_LIFT + depth - Math.max(reservoirBottom, reservoirTop + 30),
    frontZ + dz,
  );
  const bottom = new THREE.Vector3(
    well.pos.x,
    SECTION_LIFT + depth - Math.max(reservoirBottom, depth - 60),
    frontZ,
  );

  const totalDepthY = Math.max(
    SECTION_LIFT + 20,
    SECTION_LIFT + depth - Math.min(depth, well.depth),
  );
  const points =
    lateralLength > 0
      ? [start, kickoff, build, end]
      : [start, kickoff, new THREE.Vector3(well.pos.x, totalDepthY, frontZ)];
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 80, 4.2, 6, false);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(TOKENS.colors.oil),
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const tube = new THREE.Mesh(geometry, material);
  tube.layers.set(1);
  group.add(tube);


  const casingGeometry = new THREE.TubeGeometry(curve, 80, 7.5, 6, true);
  const casingMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(TOKENS.colors.primary),
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const casing = new THREE.Mesh(casingGeometry, casingMaterial);
  casing.layers.set(1);
  group.add(casing);

  const perforations: THREE.Vector3[] = [];
  const count = 7;
  for (let i = 0; i < count; i += 1) {
    const t = 0.5 + (i / count) * 0.28;
    perforations.push(curve.getPoint(t));
  }
  const pointsGeometry = new THREE.BufferGeometry().setFromPoints(perforations);
  const pointsMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(TOKENS.colors.warning),
    size: 11,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
  pointsMesh.layers.set(1);
  group.add(pointsMesh);

  const wellhead = new THREE.Group();
  const headBase = new THREE.Mesh(
    new THREE.CylinderGeometry(18, 24, 24, 12),
    new THREE.MeshStandardMaterial({ color: 0x8ea3ad, roughness: 0.55, metalness: 0.5 }),
  );
  headBase.position.set(well.pos.x, SECTION_LIFT + depth + 12, frontZ);
  wellhead.add(headBase);
  const headTop = new THREE.Mesh(
    new THREE.BoxGeometry(34, 10, 34),
    new THREE.MeshStandardMaterial({ color: TOKENS.colors.oil, roughness: 0.6, metalness: 0.2 }),
  );
  headTop.position.set(well.pos.x, SECTION_LIFT + depth + 28, frontZ);
  wellhead.add(headTop);
  group.add(wellhead);

  const labelX = well.pos.x - SECTION_WIDTH / 2 - 46;
  group.add(
    createSectionLabel(
      "井口",
      "0 m",
      labelX,
      SECTION_LIFT + depth + 8,
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
  materials: SceneMaterials,
): WellTrajectoryView {
  const group = new THREE.Group();
  group.name = "well-trajectory";
  group.visible = false;
  let content: THREE.Group | null = null;

  const clear = (): void => {
    if (!content) return;
    disposeGroup(content);
    group.remove(content);
    content = null;
  };

  const open = (well: Well): void => {
    clear();
    content = new THREE.Group();
    const depth = Math.max(MIN_DEPTH, Math.ceil((well.depth + 180) / 100) * 100);
    content.add(buildStrataBlock(well, depth, materials));
    const path = buildWellPath(well, depth);
    content.add(path);
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
      // 静态井轨迹；后续可在这里加入沿井眼上升的油流粒子。
    },
    dispose: () => {
      clear();
      group.removeFromParent();
    },
  };
}
