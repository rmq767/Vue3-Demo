import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { FieldData, Station } from "../data/types";
import type { SceneMaterials } from "../fx/materials";
import type { ScenePalette } from "../styles/tokens";

export interface Facilities {
  group: THREE.Group;
  wellGroup: THREE.Group;
  stationGroup: THREE.Group;
  blockGroup: THREE.Group;
  pickables: THREE.Object3D[];
  update(time: number, dt: number): void;
  setMarkerMode(mode: "overview" | "detail" | "near" | "hidden"): void;
  applyTheme(palette: ScenePalette): void;
  dispose(): void;
}

function transform(
  geometry: THREE.BufferGeometry,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.BufferGeometry {
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(1, 1, 1),
  );
  geometry.applyMatrix4(matrix);
  return geometry;
}

function box(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.BufferGeometry {
  return transform(new THREE.BoxGeometry(width, height, depth), x, y, z, rx, ry, rz);
}

function cylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments: number,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.BufferGeometry {
  return transform(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    x,
    y,
    z,
    rx,
    ry,
    rz,
  );
}

function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const result = mergeGeometries(parts, false) ?? new THREE.BufferGeometry();
  parts.forEach((part) => part.dispose());
  return result;
}

/** 采气树：底座法兰、主阀、油管头、四通和上主阀，总高约 7.5m。 */
function buildWellheadGeometry(): THREE.BufferGeometry {
  return merge([
    cylinder(2.0, 2.2, 0.5, 12, 0, 0.25, 0),
    cylinder(1.35, 1.55, 1.6, 10, 0, 1.3, 0),
    cylinder(1.0, 1.15, 2.2, 10, 0, 3.2, 0),
    box(3.4, 1.1, 1.7, 0, 4.85, 0),
    cylinder(0.8, 0.9, 1.3, 10, 0, 6.05, 0),
    cylinder(0.5, 0.6, 0.8, 8, 0, 7.1, 0),
  ]);
}

/** 深色阀组、手轮和出气管，和井口主体分材质实例化以获得明暗层次。 */
function buildWellheadDetailGeometry(): THREE.BufferGeometry {
  return merge([
    cylinder(0.45, 0.45, 1.4, 8, 1.7, 4.85, 0, 0, 0, Math.PI / 2),
    cylinder(0.45, 0.45, 1.4, 8, -1.7, 4.85, 0, 0, 0, Math.PI / 2),
    cylinder(0.6, 0.6, 0.24, 12, 2.45, 4.85, 0, 0, 0, Math.PI / 2),
    cylinder(0.6, 0.6, 0.24, 12, -2.45, 4.85, 0, 0, 0, Math.PI / 2),
    cylinder(0.4, 0.4, 3.6, 8, 0.9, 2.9, 1.9),
    cylinder(0.4, 0.4, 13.9, 8, 0.9, 1.1, 8.55, Math.PI / 2),
    cylinder(0.5, 0.5, 0.9, 8, 0.9, 1.1, 15.5),
    box(2.2, 0.9, 1.6, -1.6, 0.45, 3.4),
  ]);
}

function instanced(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  matrices: THREE.Matrix4[],
  ids?: string[],
  kind?: string,
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.frustumCulled = false;
  if (ids && kind) {
    mesh.userData.ids = ids;
    mesh.userData.kind = kind;
  }
  return mesh;
}

function blockTint(colorKey: string, palette: ScenePalette): string {
  if (colorKey === "sulfur") return palette.sulfur;
  if (colorKey === "water") return palette.pipeWater;
  return palette.pipeGas;
}

interface BlockMaterial {
  colorKey: string;
  material: THREE.MeshBasicMaterial;
}

function buildBlockLayer(field: FieldData, palette: ScenePalette): {
  group: THREE.Group;
  fills: BlockMaterial[];
  lines: BlockMaterial[];
} {
  const group = new THREE.Group();
  group.name = "block-boundaries";
  const fills: BlockMaterial[] = [];
  const lines: BlockMaterial[] = [];

  for (const block of field.blocks) {
    const tint = blockTint(block.colorKey, palette);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(tint),
      transparent: true,
      opacity: palette.blockFillOpacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(tint),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    fills.push({ colorKey: block.colorKey, material: fillMaterial });
    lines.push({ colorKey: block.colorKey, material: lineMaterial });

    const fill = new THREE.Mesh(new THREE.CircleGeometry(block.radius, 96), fillMaterial);
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(block.center.x, 1.4, block.center.z);
    fill.renderOrder = -1;
    fill.name = `block-fill-${block.id}`;
    group.add(fill);

    // 浅色卫星底图上 1px 虚线几乎不可见，改用有实际宽度的短段拼出虚线边界。
    const dashGeometries: THREE.BufferGeometry[] = [];
    const dashCount = 96;
    const slot = (Math.PI * 2) / dashCount;
    const dashArc = slot * 0.62;
    const dashLength = block.radius * dashArc;
    for (let index = 0; index < dashCount; index += 1) {
      const middle = index * slot + dashArc / 2;
      dashGeometries.push(
        transform(
          new THREE.BoxGeometry(dashLength, 1, 16),
          block.center.x + Math.cos(middle) * block.radius,
          4,
          block.center.z + Math.sin(middle) * block.radius,
          0,
          -middle - Math.PI / 2,
          0,
        ),
      );
    }
    const dashes = new THREE.Mesh(merge(dashGeometries), lineMaterial);
    dashes.name = `block-dashes-${block.id}`;
    group.add(dashes);
  }

  return { group, fills, lines };
}

function markerTexture(innerStop: number, feather: number): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(innerStop, "rgba(255,255,255,1)");
    gradient.addColorStop(Math.min(1, innerStop + feather), "rgba(255,255,255,0)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

function squareMarkerTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.roundRect(14, 14, 36, 36, 8);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

interface MarkerLayer {
  group: THREE.Group;
  applyTheme(palette: ScenePalette): void;
  dispose(): void;
}

interface MarkerLayersOptions {
  positions: Float32Array;
  colors: Float32Array;
  colorAttribute: THREE.BufferAttribute;
  /** 圆点用于井位，方块用于站库，避免两类设施混淆。 */
  shape?: "circle" | "square";
  haloSize: number;
  ringSize: number;
  coreSize: number;
}

function createMarkerLayers(
  options: MarkerLayersOptions,
  palette: ScenePalette,
): MarkerLayer {
  const { positions, colors, colorAttribute, shape = "circle" } = options;
  const group = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", colorAttribute);

  const haloTexture = markerTexture(0.4, 0.1);
  const ringTexture = markerTexture(0.44, 0.04);
  const coreTexture = shape === "square" ? squareMarkerTexture() : markerTexture(0.42, 0.04);

  const haloMaterial = new THREE.PointsMaterial({
    size: options.haloSize,
    sizeAttenuation: false,
    map: haloTexture,
    transparent: true,
    opacity: palette.markerHaloOpacity,
    depthTest: false,
    depthWrite: false,
    color: new THREE.Color(palette.markerHalo),
  });
  const ringMaterial = new THREE.PointsMaterial({
    size: options.ringSize,
    sizeAttenuation: false,
    map: ringTexture,
    transparent: true,
    opacity: palette.markerRingOpacity,
    depthTest: false,
    depthWrite: false,
    color: new THREE.Color(palette.markerRing),
  });
  const coreMaterial = new THREE.PointsMaterial({
    size: options.coreSize,
    sizeAttenuation: false,
    map: coreTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexColors: true,
    alphaTest: 0.08,
  });

  const halos = new THREE.Points(geometry, haloMaterial);
  halos.renderOrder = 6;
  halos.frustumCulled = false;
  const rings = new THREE.Points(geometry, ringMaterial);
  rings.renderOrder = 7;
  rings.frustumCulled = false;
  const cores = new THREE.Points(geometry, coreMaterial);
  cores.renderOrder = 8;
  cores.frustumCulled = false;
  group.add(halos, rings, cores);

  return {
    group,
    applyTheme: (next) => {
      haloMaterial.color.set(next.markerHalo);
      haloMaterial.opacity = next.markerHaloOpacity;
      ringMaterial.color.set(next.markerRing);
      ringMaterial.opacity = next.markerRingOpacity;
    },
    dispose: () => {
      geometry.dispose();
      haloMaterial.dispose();
      ringMaterial.dispose();
      coreMaterial.dispose();
      haloTexture.dispose();
      ringTexture.dispose();
      coreTexture.dispose();
    },
  };
}

/** 井位常驻符号：深色外圈 + 白色隔离环 + 状态色芯，任何底图上都能辨认。 */
function buildWellMarkers(field: FieldData, palette: ScenePalette): MarkerLayer {
  const positions = new Float32Array(field.wells.length * 3);
  const colors = new Float32Array(field.wells.length * 3);
  field.wells.forEach((well, index) => {
    positions[index * 3] = well.pos.x;
    positions[index * 3 + 1] = 24;
    positions[index * 3 + 2] = well.pos.z;
  });
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  const color = new THREE.Color();
  const writeColors = (theme: ScenePalette): void => {
    field.wells.forEach((well, index) => {
      if (well.status === "warning") color.set(theme.pipeMaintenance);
      else if (well.status === "offline") color.set(theme.pipeStopped);
      else color.set(theme.pipeGas);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });
    colorAttribute.needsUpdate = true;
  };
  writeColors(palette);

  const layer = createMarkerLayers(
    {
      positions,
      colors,
      colorAttribute,
      shape: "circle",
      haloSize: 22,
      ringSize: 15,
      coreSize: 10,
    },
    palette,
  );
  layer.group.name = "well-markers";
  const applyTheme = layer.applyTheme;
  layer.applyTheme = (next) => {
    writeColors(next);
    applyTheme(next);
  };
  return layer;
}

/** 总览视距下按平台聚合井位，避免同一井场的圆点互相叠压。 */
function buildWellClusters(field: FieldData, palette: ScenePalette): MarkerLayer {
  const platforms = field.platforms ?? [];
  const positions = new Float32Array(platforms.length * 3);
  const colors = new Float32Array(platforms.length * 3);
  platforms.forEach((platform, index) => {
    positions[index * 3] = platform.pos.x;
    positions[index * 3 + 1] = 24;
    positions[index * 3 + 2] = platform.pos.z;
  });
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  const color = new THREE.Color();
  const writeColors = (theme: ScenePalette): void => {
    platforms.forEach((platform, index) => {
      const wells = field.wells.filter((well) => well.platformId === platform.id);
      const warning = wells.some((well) => well.status === "warning");
      const allOffline = wells.length > 0 && wells.every((well) => well.status === "offline");
      if (warning) color.set(theme.pipeMaintenance);
      else if (allOffline) color.set(theme.pipeStopped);
      else color.set(theme.pipeGas);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });
    colorAttribute.needsUpdate = true;
  };
  writeColors(palette);

  const layer = createMarkerLayers(
    {
      positions,
      colors,
      colorAttribute,
      shape: "circle",
      haloSize: 30,
      ringSize: 21,
      coreSize: 13,
    },
    palette,
  );
  layer.group.name = "well-clusters";
  const applyTheme = layer.applyTheme;
  layer.applyTheme = (next) => {
    writeColors(next);
    applyTheme(next);
  };
  return layer;
}

/** 站库用方形符号，与圆形井位区分；只在总览视距显示。 */
function buildStationMarkers(field: FieldData, palette: ScenePalette): MarkerLayer {
  const positions = new Float32Array(field.stations.length * 3);
  const colors = new Float32Array(field.stations.length * 3);
  field.stations.forEach((station, index) => {
    positions[index * 3] = station.pos.x;
    positions[index * 3 + 1] = 52;
    positions[index * 3 + 2] = station.pos.z;
  });
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  const color = new THREE.Color();
  const writeColors = (theme: ScenePalette): void => {
    field.stations.forEach((station, index) => {
      if (station.status === "maintenance") color.set(theme.pipeMaintenance);
      else color.set(theme.marker);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });
    colorAttribute.needsUpdate = true;
  };
  writeColors(palette);

  const layer = createMarkerLayers(
    {
      positions,
      colors,
      colorAttribute,
      shape: "square",
      haloSize: 23,
      ringSize: 16,
      coreSize: 10.5,
    },
    palette,
  );
  layer.group.name = "station-markers";
  const applyTheme = layer.applyTheme;
  layer.applyTheme = (next) => {
    writeColors(next);
    applyTheme(next);
  };
  return layer;
}

function addPart(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  station: Station,
  pickables: THREE.Object3D[],
  rotationY = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.id = station.id;
  mesh.userData.kind = "station";
  parent.add(mesh);
  pickables.push(mesh);
  return mesh;
}

function createStation(
  station: Station,
  materials: SceneMaterials,
  heightAt: (x: number, z: number) => number,
  pickables: THREE.Object3D[],
): THREE.Group {
  const group = new THREE.Group();
  group.name = `station-${station.id}`;
  group.position.set(station.pos.x, heightAt(station.pos.x, station.pos.z), station.pos.z);
  group.rotation.y = station.rotation;

  // 深色基座在低饱和底图上给站场一个明确轮廓。
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(138, 143, 2.2, 32), materials.steelDark);
  plinth.position.y = -2.1;
  plinth.receiveShadow = true;
  group.add(plinth);

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(124, 132, 2.2, 32), materials.concrete);
  pad.position.y = -1.0;
  pad.receiveShadow = true;
  group.add(pad);

  if (station.type === "中心控制站") {
    addPart(group, new THREE.BoxGeometry(110, 20, 60), materials.building, [0, 10, 0], station, pickables);
    addPart(group, new THREE.BoxGeometry(118, 1.2, 68), materials.roof, [0, 20.6, 0], station, pickables);
    addPart(group, new THREE.BoxGeometry(42, 8, 24), materials.building, [-74, 4, -24], station, pickables);
    addPart(group, new THREE.BoxGeometry(46, 0.8, 28), materials.roof, [-74, 8.4, -24], station, pickables);
    addPart(group, new THREE.CylinderGeometry(4, 4.6, 42, 12), materials.steelDark, [66, 21, -18], station, pickables);
    addPart(group, new THREE.CylinderGeometry(0.5, 0.5, 18, 8), materials.steel, [66, 51, -18], station, pickables);
  } else if (station.type === "脱硫站") {
    for (const x of [-20, 20]) {
      addPart(group, new THREE.CylinderGeometry(7, 7.8, 44, 18), materials.tank, [x, 22, 0], station, pickables);
      addPart(group, new THREE.CylinderGeometry(7.4, 7.4, 1.2, 18), materials.steelDark, [x, 44.4, 0], station, pickables);
    }
    addPart(group, new THREE.CylinderGeometry(10, 10, 22, 18), materials.sulfur, [42, 11, 26], station, pickables);
    addPart(group, new THREE.CylinderGeometry(6.4, 6.4, 1.4, 18), materials.steelDark, [42, 22.6, 26], station, pickables);
    const vessel = new THREE.CylinderGeometry(5, 5, 30, 14);
    vessel.rotateZ(Math.PI / 2);
    addPart(group, vessel, materials.tank, [0, 8, -28], station, pickables);
    addPart(group, new THREE.BoxGeometry(42, 10, 22), materials.building, [0, 5, -52], station, pickables);
    addPart(group, new THREE.BoxGeometry(46, 0.8, 26), materials.roof, [0, 10.4, -52], station, pickables);
    for (let i = 0; i < 2; i += 1) {
      addPart(group, new THREE.BoxGeometry(0.8, 7, 0.8), materials.steel, [-8 + i * 16, 3.5, 26], station, pickables);
      addPart(group, new THREE.CylinderGeometry(0.5, 0.5, 22, 8), materials.steel, [-8 + i * 16, 7, 26], station, pickables, Math.PI / 2);
    }
  } else if (station.type === "外输首站") {
    for (const x of [-34, 0, 34]) {
      addPart(group, new THREE.BoxGeometry(18, 4, 10), materials.steel, [x, 2, 12], station, pickables);
    }
    addPart(group, new THREE.BoxGeometry(38, 9, 18), materials.building, [0, 4.5, -30], station, pickables);
    addPart(group, new THREE.BoxGeometry(42, 0.8, 22), materials.roof, [0, 9.4, -30], station, pickables);
    const manifold = new THREE.CylinderGeometry(0.9, 0.9, 86, 8);
    manifold.rotateZ(Math.PI / 2);
    addPart(group, manifold, materials.pipeGas, [0, 5.5, -4], station, pickables);
  } else if (station.type === "水处理站") {
    for (const x of [-38, 0, 38]) {
      addPart(group, new THREE.CylinderGeometry(12, 12, 16, 20), materials.tank, [x, 8, 18], station, pickables);
    }
    addPart(group, new THREE.CylinderGeometry(8, 9, 6, 20), materials.concrete, [0, 3, -24], station, pickables);
    addPart(group, new THREE.BoxGeometry(30, 8, 16), materials.building, [0, 4, -44], station, pickables);
    addPart(group, new THREE.BoxGeometry(34, 0.8, 20), materials.roof, [0, 8.4, -44], station, pickables);
  } else {
    addPart(group, new THREE.BoxGeometry(54, 10, 26), materials.building, [0, 5, -18], station, pickables);
    addPart(group, new THREE.BoxGeometry(58, 1, 30), materials.roof, [0, 10.4, -18], station, pickables);
    addPart(group, new THREE.BoxGeometry(34, 8, 18), materials.building, [48, 4, 12], station, pickables);
    addPart(group, new THREE.BoxGeometry(38, 0.8, 22), materials.roof, [48, 8.4, 12], station, pickables);
  }

  return group;
}

export function createFacilities(
  field: FieldData,
  materials: SceneMaterials,
  heightAt: (x: number, z: number) => number,
  palette: ScenePalette,
): Facilities {
  const group = new THREE.Group();
  group.name = "facilities";
  const wellGroup = new THREE.Group();
  wellGroup.name = "wells";
  const stationGroup = new THREE.Group();
  stationGroup.name = "stations";
  const blockGroup = new THREE.Group();
  blockGroup.name = "blocks";
  group.add(wellGroup);
  group.add(stationGroup);
  group.add(blockGroup);
  const pickables: THREE.Object3D[] = [];
  const localMaterials: THREE.Material[] = [];

  const platforms = field.platforms ?? [];
  if (platforms.length) {
    // 场坪按 190m × 90m 的六井平台尺度：北侧一排井口，南侧汇管、分离器和控制房。
    const padGeometry = new THREE.BoxGeometry(190, 1.2, 90);
    const padMatrices = platforms.map((platform) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(platform.pos.x, heightAt(platform.pos.x, platform.pos.z) + 0.1, platform.pos.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    const plinthGeometry = new THREE.BoxGeometry(196, 0.8, 96);
    const plinthMatrices = platforms.map((platform) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(platform.pos.x, heightAt(platform.pos.x, platform.pos.z) - 0.5, platform.pos.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    const plinths = instanced(plinthGeometry, materials.steelDark, plinthMatrices);
    plinths.name = "platform-plinths";
    wellGroup.add(plinths);

    const pads = instanced(padGeometry, materials.concrete, padMatrices);
    pads.receiveShadow = true;
    pads.name = "platform-pads";
    wellGroup.add(pads);

    const kerbGeometry = merge([
      box(193, 1.4, 3, 0, 0, 46.5),
      box(193, 1.4, 3, 0, 0, -46.5),
      box(3, 1.4, 90, -96.5, 0, 0),
      box(3, 1.4, 90, 96.5, 0, 0),
    ]);
    const kerbMatrices = platforms.map((platform) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(platform.pos.x, heightAt(platform.pos.x, platform.pos.z) + 0.7, platform.pos.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    const kerbs = instanced(kerbGeometry, materials.steelDark, kerbMatrices);
    kerbs.receiveShadow = true;
    kerbs.name = "platform-kerbs";
    wellGroup.add(kerbs);

    // 集气汇管：各井出气管沿 -z 汇入，东端转输至分离器。
    const headerParts: THREE.BufferGeometry[] = [
      cylinder(0.6, 0.6, 136, 12, 16, 2.5, -8, 0, 0, Math.PI / 2),
    ];
    for (let x = -48; x <= 80; x += 16) {
      headerParts.push(box(1.1, 1.8, 1.1, x, 1.6, -8));
    }
    headerParts.push(
      cylinder(0.5, 0.5, 1.8, 10, 84, 2.5, -8),
      cylinder(0.5, 0.5, 15, 10, 84, 3.5, -0.5, Math.PI / 2),
      cylinder(0.45, 0.45, 1.8, 8, 84, 5, 10),
    );
    // 卧式分离器落在汇管东端。
    headerParts.push(
      box(2.6, 1.3, 1.8, 84, 1, 9),
      box(2.6, 1.3, 1.8, 84, 1, 19),
    );
    const headerMatrices = platforms.map((platform) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(platform.pos.x, heightAt(platform.pos.x, platform.pos.z), platform.pos.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    const headers = instanced(merge(headerParts), materials.steel, headerMatrices);
    headers.castShadow = true;
    headers.receiveShadow = true;
    headers.name = "platform-headers";
    wellGroup.add(headers);

    const separatorGeometry = merge([
      cylinder(2.0, 2.0, 14, 16, 0, 3.5, 14, Math.PI / 2),
      cylinder(0.6, 0.6, 1.2, 8, 0, 5.8, 10),
    ]);
    const separators = instanced(separatorGeometry, materials.tank, headerMatrices);
    separators.castShadow = true;
    separators.receiveShadow = true;
    separators.name = "platform-separators";
    wellGroup.add(separators);

    const buildingGeometry = box(14, 4.5, 8, -78, 2.25, 10);
    const buildingMatrices = headerMatrices;
    const buildings = instanced(buildingGeometry, materials.building, buildingMatrices);
    buildings.castShadow = true;
    buildings.receiveShadow = true;
    buildings.name = "platform-buildings";
    wellGroup.add(buildings);

    const roofGeometry = box(15, 0.7, 9, -78, 4.85, 10);
    const roofs = instanced(roofGeometry, materials.roof, buildingMatrices);
    roofs.castShadow = true;
    roofs.name = "platform-roofs";
    wellGroup.add(roofs);

    // 放空立管，给井场一个可辨认的竖向标志物。
    const flareGeometry = merge([
      cylinder(0.45, 0.6, 26, 10, 86, 13, -38),
      box(3, 1, 3, 86, 0.5, -38),
      box(3, 0.25, 0.25, 86, 25.6, -38),
    ]);
    const flares = instanced(flareGeometry, materials.steelDark, buildingMatrices);
    flares.castShadow = true;
    flares.name = "platform-flares";
    wellGroup.add(flares);
  }

  const wellPadGeometry = new THREE.BoxGeometry(8, 0.6, 6.5);
  const wellPadMatrices: THREE.Matrix4[] = [];
  const wellheadMatrices: THREE.Matrix4[] = [];
  const wellIds: string[] = [];
  for (const well of field.wells) {
    const y = heightAt(well.pos.x, well.pos.z);
    wellPadMatrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(well.pos.x, y + 1, well.pos.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), well.rotation),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    wellheadMatrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(well.pos.x, y + 1.3, well.pos.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), well.rotation),
        new THREE.Vector3(1.35, 1.35, 1.35),
      ),
    );
    wellIds.push(well.id);
  }

  const wellPads = instanced(wellPadGeometry, materials.concrete, wellPadMatrices);
  wellPads.receiveShadow = true;
  wellPads.name = "well-pads";
  wellGroup.add(wellPads);

  const wellheads = instanced(buildWellheadGeometry(), materials.steel, wellheadMatrices, wellIds, "well");
  wellheads.castShadow = true;
  wellheads.receiveShadow = true;
  wellheads.name = "wellheads";
  wellGroup.add(wellheads);
  pickables.push(wellheads);

  const wellheadDetails = instanced(
    buildWellheadDetailGeometry(),
    materials.steelDark,
    wellheadMatrices,
    wellIds,
    "well",
  );
  wellheadDetails.castShadow = true;
  wellheadDetails.receiveShadow = true;
  wellheadDetails.name = "wellhead-details";
  wellGroup.add(wellheadDetails);
  pickables.push(wellheadDetails);

  const markers = buildWellMarkers(field, palette);
  wellGroup.add(markers.group);
  const clusters = buildWellClusters(field, palette);
  wellGroup.add(clusters.group);

  for (const station of field.stations) {
    stationGroup.add(createStation(station, materials, heightAt, pickables));
  }

  const stationMarkers = buildStationMarkers(field, palette);
  stationGroup.add(stationMarkers.group);

  const blocks = buildBlockLayer(field, palette);
  blockGroup.add(blocks.group);
  blocks.fills.forEach((entry) => localMaterials.push(entry.material));
  blocks.lines.forEach((entry) => localMaterials.push(entry.material));

  const applyTheme = (next: ScenePalette): void => {
    blocks.fills.forEach((entry) => {
      entry.material.color.set(blockTint(entry.colorKey, next));
      entry.material.opacity = next.blockFillOpacity;
    });
    blocks.lines.forEach((entry) => {
      entry.material.color.set(blockTint(entry.colorKey, next));
    });
    markers.applyTheme(next);
    clusters.applyTheme(next);
    stationMarkers.applyTheme(next);
  };

  return {
    group,
    wellGroup,
    stationGroup,
    blockGroup,
    pickables,
    update: () => {
      // 静态气田场景，不再驱动抽油机、火炬或烟雾动画。
    },
    setMarkerMode: (mode) => {
      markers.group.visible = mode === "detail";
      clusters.group.visible = mode === "overview";
      stationMarkers.group.visible = mode === "overview" || mode === "detail" || mode === "near";
    },
    applyTheme,
    dispose: () => {
      markers.dispose();
      clusters.dispose();
      stationMarkers.dispose();
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      localMaterials.forEach((material) => material.dispose());
    },
  };
}
