import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
  PALETTE,
  SCENE,
  STATION_COUNT,
  STRATA,
  TOTAL_DEPTH,
  type Stratum,
} from "./tokens";
import { mulberry32 } from "./random";
import type { Terrain } from "./terrain";

export interface StrataLayer {
  stratum: Stratum;
  mesh: THREE.Mesh;
  label: CSS2DObject;
  /** 层顶埋深，米（自 y=0 基准面往下为正） */
  topDepth: number;
  bottomDepth: number;
}

export interface Station {
  index: number;
  name: string;
  x: number;
  z: number;
  elevation: number;
  scale: number;
  yaw: number;
  status: "normal" | "busy";
}

export interface WellReadout {
  /** 测深：自井口沿轨迹的长度，米 */
  measured: number;
  /** 垂深：相对 y=0 基准面，米 */
  vertical: number;
}

export interface GeologyBody {
  group: THREE.Group;
  layers: StrataLayer[];
  axis: THREE.Line;
  wellMesh: THREE.Mesh;
  stationMesh: THREE.InstancedMesh;
  stations: Station[];
  /** 参与剖切的材质，井眼不在其中 */
  clipMaterials: THREE.Material[];
  /** 全井测深，米 */
  wellDepth: number;
  wellReadout(point: THREE.Vector3): WellReadout;
  placeAxis(axisKind: "x" | "z", limit: number): void;
  setLayerVisible(index: number, visible: boolean): void;
  setLayerNameVisible(visible: boolean): void;
  /** 垂直夸张会同时改地形、站库落位和井口高程，必须一起重算 */
  setExaggeration(value: number): void;
  getExaggeration(): number;
  /** 高亮某颗站库实例，传 null 清除 */
  setStationHighlight(index: number | null): void;
}

/** 深度轴与层名标签挂靠的角点，保证默认机位下都在正面 */
const EDGE = { x: SCENE.width / 2, z: SCENE.depth / 2 };

/** 站库罐体高度，落位时按它把底面贴到地形上 */
const STATION_HEIGHT = 3.6;

function makeLabel(text: string): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = [
    "font:500 11px/1 Bahnschrift,'DIN Alternate',sans-serif",
    `color:${PALETTE.inkSoft}`,
    `background:${PALETTE.panel}`,
    `border:1px solid ${PALETTE.hairline}`,
    "padding:2px 6px",
    "border-radius:2px",
    "white-space:nowrap",
    "pointer-events:none",
    "letter-spacing:.04em",
  ].join(";");
  return el;
}

export function createGeology(terrain: Terrain): GeologyBody {
  const group = new THREE.Group();
  group.name = "geology";

  // ---- 岩心层组：每层一个盒体，自上而下堆到 TOTAL_DEPTH ----
  const layers: StrataLayer[] = [];
  /** 参与剖切的材质：岩体、层界线、站库；井眼故意排除，切开后要能看见完整轨迹 */
  const clipMaterials: THREE.Material[] = [];
  let topDepth = 0;
  STRATA.forEach((stratum, i) => {
    const geometry = new THREE.BoxGeometry(
      SCENE.width,
      stratum.thickness,
      SCENE.depth
    );
    const color = new THREE.Color(stratum.color);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.98,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -(topDepth + stratum.thickness / 2);
    mesh.name = `strata-${i}`;
    mesh.userData = { kind: "stratum", layerIndex: i };
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    // 层界线：剖切面上靠它读地层分界，比只换个颜色清楚得多
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: color.clone().multiplyScalar(0.5),
        transparent: true,
        opacity: 0.55,
      })
    );
    // 层界线只作视觉分层，屏蔽 raycast 后拾取结果始终落到实体层上
    edges.raycast = () => {};
    mesh.add(edges);
    clipMaterials.push(material, edges.material as THREE.Material);

    const label = new CSS2DObject(makeLabel(stratum.name));
    label.position.set(EDGE.x + 6, -(topDepth + stratum.thickness / 2), EDGE.z + 6);
    label.center.set(0, 0.5);
    group.add(label);

    group.add(mesh);
    layers.push({
      stratum,
      mesh,
      label,
      topDepth,
      bottomDepth: topDepth + stratum.thickness,
    });
    topDepth += stratum.thickness;
  });

  // ---- 深度轴 ----
  const axisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(EDGE.x, 0, EDGE.z),
    new THREE.Vector3(EDGE.x, -TOTAL_DEPTH, EDGE.z),
  ]);
  const axis = new THREE.Line(
    axisGeometry,
    new THREE.LineBasicMaterial({ color: PALETTE.clip })
  );
  axis.raycast = () => {};
  group.add(axis);

  // ---- 井眼：程序化测点 -> 样条 -> 管道 ----
  // 井眼不参与剖切，切开的岩体里要能看见完整轨迹
  const surfaceX = SCENE.width * 0.22;
  const surfaceZ = SCENE.depth * 0.1;
  const wellCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(surfaceX, 0, surfaceZ),
    new THREE.Vector3(surfaceX, -18, surfaceZ),
    new THREE.Vector3(surfaceX - 6, -44, surfaceZ - 4),
    new THREE.Vector3(surfaceX - 34, -66, surfaceZ - 8),
    new THREE.Vector3(surfaceX - 78, -74, surfaceZ - 10),
    new THREE.Vector3(surfaceX - 104, -70, surfaceZ - 6),
  ]);
  const wellMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.wellbore,
    roughness: 0.45,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });
  const wellMesh = new THREE.Mesh(new THREE.BufferGeometry(), wellMaterial);
  wellMesh.name = "wellbore";
  wellMesh.userData = { kind: "well" };
  wellMesh.renderOrder = 1;
  group.add(wellMesh);

  const SAMPLES = 400;
  let wellSamples: THREE.Vector3[] = [];
  let wellLengths: number[] = [];
  const buildWell = () => {
    wellCurve.points[0].set(
      surfaceX,
      terrain.heightAt(surfaceX, surfaceZ),
      surfaceZ
    );
    wellMesh.geometry.dispose();
    wellMesh.geometry = new THREE.TubeGeometry(wellCurve, 220, 1.6, 10, false);
    wellSamples = wellCurve.getPoints(SAMPLES);
    wellLengths = wellCurve.getLengths(SAMPLES);
  };
  buildWell();

  /** 命中点最近的轨迹采样 -> 测深 / 垂深 */
  const wellReadout = (point: THREE.Vector3): WellReadout => {
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < wellSamples.length; i++) {
      const d = wellSamples[i].distanceToSquared(point);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    return { measured: wellLengths[best], vertical: -point.y };
  };

  // ---- 地面站库：一个 InstancedMesh 装完，只吃一次 draw call ----
  const random = mulberry32(SCENE.seed + 7);
  const stations: Station[] = [];
  const stationGeometry = new THREE.CylinderGeometry(
    1.8,
    1.8,
    STATION_HEIGHT,
    14
  );
  const stationMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.6,
    metalness: 0.2,
  });
  const stationMesh = new THREE.InstancedMesh(
    stationGeometry,
    stationMaterial,
    STATION_COUNT
  );
  stationMesh.name = "stations";
  stationMesh.userData = { kind: "station" };
  stationMesh.castShadow = true;
  stationMesh.receiveShadow = true;
  stationMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const transform = new THREE.Object3D();
  const normal = new THREE.Color(PALETTE.stationNormal);
  const busy = new THREE.Color(PALETTE.stationBusy);
  const inset = 14;
  for (let i = 0; i < STATION_COUNT; i++) {
    const x = (random() * 2 - 1) * (SCENE.width / 2 - inset);
    const z = (random() * 2 - 1) * (SCENE.depth / 2 - inset);
    const scale = 0.8 + random() * 0.9;
    const yaw = random() * Math.PI;
    const status: Station["status"] = random() > 0.78 ? "busy" : "normal";
    stationMesh.setColorAt(i, status === "busy" ? busy : normal);
    stations.push({
      index: i,
      name: `站库 ${String(i + 1).padStart(2, "0")}`,
      x,
      z,
      elevation: 0,
      scale,
      yaw,
      status,
    });
  }
  if (stationMesh.instanceColor) stationMesh.instanceColor.needsUpdate = true;

  /** 站库只靠地形高程函数落位，垂直夸张一变就能整体重新坐回地面 */
  const seatStations = () => {
    for (const station of stations) {
      station.elevation = terrain.heightAt(station.x, station.z);
      transform.position.set(
        station.x,
        station.elevation + (STATION_HEIGHT * station.scale) / 2,
        station.z
      );
      transform.rotation.set(0, station.yaw, 0);
      transform.scale.setScalar(station.scale);
      transform.updateMatrix();
      stationMesh.setMatrixAt(station.index, transform.matrix);
    }
    stationMesh.instanceMatrix.needsUpdate = true;
    stationMesh.computeBoundingSphere();
  };
  seatStations();
  group.add(stationMesh);

  const setLayerVisible = (index: number, visible: boolean) => {
    const layer = layers[index];
    if (!layer) return;
    layer.mesh.visible = visible;
    layer.label.visible = visible;
  };

  const setLayerNameVisible = (visible: boolean) => {
    layers.forEach((layer) => {
      layer.label.visible = visible && layer.mesh.visible;
    });
  };

  /** 选中态只落在实例颜色上，不给整场景加发光层 */
  const selectColor = new THREE.Color(PALETTE.select);
  let highlighted: number | null = null;
  const setStationHighlight = (index: number | null) => {
    if (highlighted !== null) {
      const previous = stations[highlighted];
      stationMesh.setColorAt(
        highlighted,
        previous.status === "busy" ? busy : normal
      );
    }
    if (index !== null) stationMesh.setColorAt(index, selectColor);
    if (stationMesh.instanceColor) stationMesh.instanceColor.needsUpdate = true;
    highlighted = index;
  };

  /**
   * 深度轴与层名标签跟着剖切面走。
   * 标注若钉在盒子角点上，切掉的那半边空间里会留下孤立文字。
   */
  const placeAxis = (axisKind: "x" | "z", limit: number) => {
    const halfX = SCENE.width / 2;
    const halfZ = SCENE.depth / 2;
    const points = axisGeometry.attributes.position as THREE.BufferAttribute;
    layers.forEach((layer) => {
      const mid = -(layer.topDepth + layer.bottomDepth) / 2;
      layer.label.position.set(
        axisKind === "x" ? limit : halfX + 14,
        mid,
        axisKind === "x" ? halfZ + 14 : limit
      );
    });
    if (axisKind === "x") {
      points.setXYZ(0, limit, 0, halfZ);
      points.setXYZ(1, limit, -TOTAL_DEPTH, halfZ);
    } else {
      points.setXYZ(0, halfX, 0, limit);
      points.setXYZ(1, halfX, -TOTAL_DEPTH, limit);
    }
    points.needsUpdate = true;
  };
  placeAxis("x", SCENE.width / 2);

  const setExaggeration = (value: number) => {
    terrain.setExaggeration(value);
    seatStations();
    buildWell();
  };

  return {
    group,
    layers,
    axis,
    wellMesh,
    stationMesh,
    stations,
    clipMaterials: [...clipMaterials, stationMesh.material as THREE.Material],
    wellDepth: wellCurve.getLength(),
    wellReadout,
    setLayerVisible,
    setLayerNameVisible,
    setStationHighlight,
    setExaggeration,
    getExaggeration: terrain.getExaggeration,
    placeAxis,
  };
}
