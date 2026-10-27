import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { FieldData, Station, Well } from "../data/types";
import type { SceneMaterials } from "../fx/materials";
import { TOKENS } from "../styles/tokens";

export interface Facilities {
  group: THREE.Group;
  wellGroup: THREE.Group;
  stationGroup: THREE.Group;
  blockGroup: THREE.Group;
  pickables: THREE.Object3D[];
  update(time: number, dt: number): void;
  dispose(): void;
}

const PUMP_SCALE = 1.35;

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

function statusColor(well: Well): THREE.Color {
  if (well.status === "warning") return new THREE.Color(TOKENS.colors.warning);
  if (well.status === "offline") return new THREE.Color(TOKENS.colors.inkMuted);
  return new THREE.Color(TOKENS.colors.primary);
}

function buildPumpStaticGeometry(): THREE.BufferGeometry {
  return merge([
    box(19, 0.5, 7.5, 0, 0.25, 0),
    box(16, 1.25, 6.2, 0, 0.95, 0),
    // A 字支架
    box(0.75, 7.2, 0.75, -1.4, 4.3, 2.5, 0.1, 0, 0.33),
    box(0.75, 7.2, 0.75, -1.4, 4.3, -2.5, -0.1, 0, 0.33),
    box(0.75, 7.2, 0.75, 3.0, 4.3, 2.4, 0.1, 0, -0.28),
    box(0.75, 7.2, 0.75, 3.0, 4.3, -2.4, -0.1, 0, -0.28),
    box(3.6, 1.1, 4.8, 0.8, 7.25, 0),
    // 减速箱与电机
    box(2.6, 2.2, 2.5, -2.6, 4.8, 0),
    box(3.6, 2.5, 2.4, -6.6, 2.2, 0),
    cylinder(0.8, 0.8, 2.6, 12, -6.6, 2.2, 1.7, Math.PI / 2),
    // 井口
    cylinder(0.7, 0.9, 2.2, 10, 9.4, 1.6, 0),
    box(1.6, 0.55, 1.6, 9.4, 2.8, 0),
    box(0.35, 4.2, 0.35, 9.4, 4.2, 0),
    // 防护栏细节
    box(0.18, 1.6, 7.4, -9.2, 1.4, 0),
    box(0.18, 1.6, 7.4, 6.5, 1.4, 0),
  ]);
}

function buildBeamGeometry(): THREE.BufferGeometry {
  return merge([
    box(19, 0.9, 1.5, 0, 0, 0),
    box(3.4, 3.4, 1.7, 9.0, -1.25, 0),
    box(0.35, 4.4, 0.35, 9.3, -3.5, 0),
    box(4.3, 1.9, 1.5, -6.3, -1.15, 0),
    box(1.1, 2.2, 1.2, 0, -1.2, 0),
  ]);
}

function buildCrankGeometry(): THREE.BufferGeometry {
  const disc = transform(
    new THREE.CylinderGeometry(1.7, 1.7, 1.2, 18),
    0,
    -4.6,
    0,
    Math.PI / 2,
    0,
    0,
  );
  return merge([
    box(1.15, 5.2, 1.25, 0, -2.5, 0),
    disc,
    box(2.8, 0.9, 1.2, 0, -4.6, 0),
  ]);
}

function buildTankGeometry(): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(14, 14, 22, 28, 1, false);
  body.translate(0, 11, 0);
  const cap = new THREE.SphereGeometry(14, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.scale(1, 0.32, 1);
  cap.translate(0, 22, 0);
  const rim = new THREE.TorusGeometry(14.1, 0.28, 5, 36);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, 22, 0);
  return merge([body, cap, rim]);
}

function buildBuildingGeometry(): THREE.BufferGeometry {
  return merge([
    box(26, 9.6, 17, 0, 4.8, 0),
    box(27.5, 0.7, 18.5, 0, 9.85, 0),
    box(0.18, 4.6, 3.4, 13.05, 2.4, 0),
  ]);
}

function buildRackGeometry(): THREE.BufferGeometry {
  return merge([
    box(0.7, 7.6, 0.7, -6, 3.8, 0),
    box(0.7, 7.6, 0.7, 6, 3.8, 0),
    cylinder(0.32, 0.32, 12.5, 8, 0, 4.2, 0, 0, 0, Math.PI / 2),
    cylinder(0.32, 0.32, 12.5, 8, 0, 5.2, 1.1, 0, 0, Math.PI / 2),
    cylinder(0.32, 0.32, 12.5, 8, 0, 6.2, -1.1, 0, 0, Math.PI / 2),
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

function buildRoads(
  field: FieldData,
  heightAt: (x: number, z: number) => number,
): THREE.Group {
  const group = new THREE.Group();
  group.name = "roads";
  const central = field.stations[0];
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x303b3e,
    roughness: 0.92,
    metalness: 0.03,
  });
  const allPositions: number[] = [];

  field.stations.slice(1).forEach((station, index) => {
    const mid = {
      x: (station.pos.x + central.pos.x) / 2 + (index % 2 === 0 ? 120 : -120),
      z: (station.pos.z + central.pos.z) / 2 + (index % 2 === 0 ? 80 : -80),
    };
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(station.pos.x, heightAt(station.pos.x, station.pos.z) + 2, station.pos.z),
      new THREE.Vector3(mid.x, heightAt(mid.x, mid.z) + 2, mid.z),
      new THREE.Vector3(central.pos.x, heightAt(central.pos.x, central.pos.z) + 2, central.pos.z),
    ]);
    const samples = 40;
    const width = 8;
    for (let i = 0; i < samples; i += 1) {
      const t0 = i / samples;
      const t1 = (i + 1) / samples;
      const p0 = curve.getPoint(t0);
      const p1 = curve.getPoint(t1);
      const tangent = p1.clone().sub(p0).setY(0).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
      const a = p0.clone().add(normal);
      const b = p0.clone().sub(normal);
      const c = p1.clone().add(normal);
      const d = p1.clone().sub(normal);
      a.y = heightAt(a.x, a.z) + 2.2;
      b.y = heightAt(b.x, b.z) + 2.2;
      c.y = heightAt(c.x, c.z) + 2.2;
      d.y = heightAt(d.x, d.z) + 2.2;
      allPositions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      allPositions.push(b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
    }

  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(allPositions, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, roadMaterial);
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

function buildBlockBoundaries(field: FieldData): THREE.Group {
  const group = new THREE.Group();
  group.name = "block-boundaries";
  const colors = TOKENS.colors as Record<string, string>;

  field.blocks.forEach((block) => {
    const color = new THREE.Color(colors[block.colorKey] ?? TOKENS.colors.primary);
    const points: THREE.Vector3[] = [];
    const count = 90;
    for (let i = 0; i <= count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          block.center.x + Math.cos(angle) * block.radius,
          4,
          block.center.z + Math.sin(angle) * block.radius,
        ),
      );
    }
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity: 0.36,
      dashSize: 28,
      gapSize: 18,
      depthWrite: false,
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances();
    group.add(line);

    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(block.radius, 90).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.022,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    fill.position.set(block.center.x, 1.2, block.center.z);
    group.add(fill);
  });

  return group;
}

function buildRocks(
  materials: SceneMaterials,
  heightAt: (x: number, z: number) => number,
): THREE.InstancedMesh {
  const count = 180;
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const matrices: THREE.Matrix4[] = [];
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  let seed = 907;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 150 + random() * 1450;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (z > Math.abs(x) * 1.04) {
      i -= 1;
      continue;
    }
    const size = 2 + random() * 7;
    position.set(x, heightAt(x, z) + size * 0.3, z);
    quaternion.setFromEuler(new THREE.Euler(random(), random() * Math.PI, random()));
    scale.set(size, size * (0.4 + random() * 0.5), size * (0.7 + random() * 0.8));
    matrices.push(new THREE.Matrix4().compose(position, quaternion, scale));
  }
  const mesh = instanced(geometry, materials.rock, matrices);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = "rocks";
  return mesh;
}

export function createFacilities(
  field: FieldData,
  materials: SceneMaterials,
  heightAt: (x: number, z: number) => number,
): Facilities {
  const group = new THREE.Group();
  group.name = "facilities";
  const wellGroup = new THREE.Group();
  wellGroup.name = "wells";
  const stationGroup = new THREE.Group();
  stationGroup.name = "stations";
  const blockGroup = buildBlockBoundaries(field);
  group.add(wellGroup);
  group.add(stationGroup);
  group.add(blockGroup);
  const pickables: THREE.Object3D[] = [];

  const pumpStaticGeometry = buildPumpStaticGeometry().scale(PUMP_SCALE, PUMP_SCALE, PUMP_SCALE);
  const beamGeometry = buildBeamGeometry().scale(PUMP_SCALE, PUMP_SCALE, PUMP_SCALE);
  const crankGeometry = buildCrankGeometry().scale(PUMP_SCALE, PUMP_SCALE, PUMP_SCALE);
  const wellIds = field.wells.map((well) => well.id);

  const staticMatrices: THREE.Matrix4[] = [];
  const beamMatrices: THREE.Matrix4[] = [];
  const crankMatrices: THREE.Matrix4[] = [];
  const ringMatrices: THREE.Matrix4[] = [];
  const padMatrices: THREE.Matrix4[] = [];
  const pumpMeta: { well: Well; top: number }[] = [];
  const ringColors: THREE.Color[] = [];

  for (const well of field.wells) {
    const top = heightAt(well.pos.x, well.pos.z);
    pumpMeta.push({ well, top });
    const base = new THREE.Matrix4().compose(
      new THREE.Vector3(well.pos.x, top, well.pos.z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), well.rotation),
      new THREE.Vector3(1, 1, 1),
    );
    staticMatrices.push(base);

    const beam = new THREE.Matrix4().compose(
      new THREE.Vector3(well.pos.x, top + 6.8 * PUMP_SCALE, well.pos.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, well.rotation, 0.12, "YXZ")),
      new THREE.Vector3(1, 1, 1),
    );
    beamMatrices.push(beam);

    const crank = new THREE.Matrix4().compose(
      new THREE.Vector3(well.pos.x, top + 2.8 * PUMP_SCALE, well.pos.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, well.rotation, 0, "YXZ")),
      new THREE.Vector3(1, 1, 1),
    );
    crankMatrices.push(crank);

    const ring = new THREE.Matrix4().compose(
      new THREE.Vector3(well.pos.x, top + 1.4, well.pos.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
      new THREE.Vector3(1, 1, 1),
    );
    ringMatrices.push(ring);
    ringColors.push(statusColor(well));

    padMatrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(well.pos.x, top - 0.8, well.pos.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );
  }

  const staticMesh = instanced(pumpStaticGeometry, materials.steel, staticMatrices, wellIds, "well");
  staticMesh.castShadow = true;
  staticMesh.receiveShadow = true;
  staticMesh.name = "pump-static";
  wellGroup.add(staticMesh);
  pickables.push(staticMesh);

  const beamMesh = instanced(beamGeometry, materials.steel, beamMatrices, wellIds, "well");
  beamMesh.castShadow = true;
  beamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  beamMesh.name = "pump-beam";
  wellGroup.add(beamMesh);
  pickables.push(beamMesh);

  const crankMesh = instanced(crankGeometry, materials.steel, crankMatrices, wellIds, "well");
  crankMesh.castShadow = true;
  crankMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crankMesh.name = "pump-crank";
  wellGroup.add(crankMesh);
  pickables.push(crankMesh);

  const padGeometry = new THREE.CylinderGeometry(21, 23, 1.8, 18);
  const pads = instanced(padGeometry, materials.road, padMatrices);
  pads.receiveShadow = true;
  pads.name = "well-pads";
  wellGroup.add(pads);

  // 井位光点：远景时让 42 口井形成可读的星点网络
  const wellPositions: number[] = [];
  const wellColors: number[] = [];
  for (const well of field.wells) {
    const top = heightAt(well.pos.x, well.pos.z);
    wellPositions.push(well.pos.x, top + 14, well.pos.z);
    const color = statusColor(well);
    wellColors.push(color.r, color.g, color.b);
  }
  const wellLightGeometry = new THREE.BufferGeometry();
  wellLightGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(wellPositions, 3),
  );
  wellLightGeometry.setAttribute("color", new THREE.Float32BufferAttribute(wellColors, 3));
  const wellLightMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 18,
    map: materials.glowSprite.map,
    vertexColors: true,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const wellLights = new THREE.Points(wellLightGeometry, wellLightMaterial);
  wellLights.layers.set(1);
  wellLights.name = "well-lights";
  wellGroup.add(wellLights);

  const stationPositions: number[] = [];
  const stationColors: number[] = [];
  for (const station of field.stations) {
    const top = heightAt(station.pos.x, station.pos.z);
    stationPositions.push(station.pos.x, top + 28, station.pos.z);
    const color =
      station.id === "S-01"
        ? new THREE.Color(TOKENS.colors.oil)
        : new THREE.Color(TOKENS.colors.primary);
    stationColors.push(color.r, color.g, color.b);
  }
  const stationLightGeometry = new THREE.BufferGeometry();
  stationLightGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(stationPositions, 3),
  );
  stationLightGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(stationColors, 3),
  );
  const stationLightMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 34,
    map: materials.glowSprite.map,
    vertexColors: true,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const stationLights = new THREE.Points(stationLightGeometry, stationLightMaterial);
  stationLights.layers.set(1);
  stationLights.name = "station-lights";
  stationGroup.add(stationLights);

  const tankMatrices: THREE.Matrix4[] = [];
  const tankIds: string[] = [];
  const tankLevelMatrices: THREE.Matrix4[] = [];
  const tankLevelColors: THREE.Color[] = [];
  const buildingMatrices: THREE.Matrix4[] = [];
  const buildingIds: string[] = [];
  const rackMatrices: THREE.Matrix4[] = [];
  const rackIds: string[] = [];
  const stationPadMatrices: THREE.Matrix4[] = [];

  for (const station of field.stations) {
    const h = heightAt(station.pos.x, station.pos.z);
    stationPadMatrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(station.pos.x, h - 1.1, station.pos.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );

    for (let i = 0; i < station.tanks; i += 1) {
      const offset = (i - (station.tanks - 1) / 2) * 34;
      const x = station.pos.x + offset;
      const z = station.pos.z + 44;
      const scale = 0.82 + (i % 3) * 0.1;
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3(x, h, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), station.rotation),
        new THREE.Vector3(scale, scale, scale),
      );
      tankMatrices.push(matrix);
      tankIds.push(station.id);
      const levelY = h + (7 + (i % 3) * 4) * scale;
      tankLevelMatrices.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, levelY, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)),
          new THREE.Vector3(scale, scale, scale),
        ),
      );
      tankLevelColors.push(
        new THREE.Color(station.type === "注水站" ? TOKENS.colors.water : TOKENS.colors.oil),
      );
    }

    for (let i = 0; i < station.buildings; i += 1) {
      const x = station.pos.x - 34 + (i % 2) * 46;
      const z = station.pos.z - 52 - Math.floor(i / 2) * 32;
      buildingMatrices.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, h, z),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), station.rotation),
          new THREE.Vector3(0.9, 0.9, 0.9),
        ),
      );
      buildingIds.push(station.id);
    }

    for (let i = 0; i < 2; i += 1) {
      rackMatrices.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(station.pos.x - 36 + i * 18, h, station.pos.z + 4),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), station.rotation),
          new THREE.Vector3(1, 1, 1),
        ),
      );
      rackIds.push(station.id);
    }
  }

  const tankMesh = instanced(buildTankGeometry(), materials.tank, tankMatrices, tankIds, "station");
  tankMesh.castShadow = true;
  tankMesh.receiveShadow = true;
  tankMesh.name = "station-tanks";
  stationGroup.add(tankMesh);
  pickables.push(tankMesh);

  const buildingMesh = instanced(
    buildBuildingGeometry(),
    materials.building,
    buildingMatrices,
    buildingIds,
    "station",
  );
  buildingMesh.castShadow = true;
  buildingMesh.receiveShadow = true;
  buildingMesh.name = "station-buildings";
  stationGroup.add(buildingMesh);
  pickables.push(buildingMesh);

  const rackMesh = instanced(buildRackGeometry(), materials.pipe, rackMatrices, rackIds, "station");
  rackMesh.castShadow = true;
  rackMesh.name = "station-racks";
  stationGroup.add(rackMesh);
  pickables.push(rackMesh);

  const padGeometryStation = new THREE.CylinderGeometry(104, 112, 2.2, 30);
  const stationPads = instanced(padGeometryStation, materials.road, stationPadMatrices);
  stationPads.receiveShadow = true;
  stationPads.name = "station-pads";
  stationGroup.add(stationPads);

  const central = field.stations[0];
  const centralHeight = heightAt(central.pos.x, central.pos.z);

  const centralRing = new THREE.Mesh(
    new THREE.RingGeometry(138, 142, 80).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(TOKENS.colors.oil),
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  centralRing.position.set(central.pos.x, 2.4, central.pos.z);
  centralRing.name = "central-station-ring";
  stationGroup.add(centralRing);

  const flareX = central.pos.x + 220;
  const flareZ = central.pos.z - 120;
  const flareHeight = heightAt(flareX, flareZ);
  const flareParts = [
    box(1.1, 150, 1.1, -7, 75, 0),
    box(1.1, 150, 1.1, 7, 75, 0),
    box(1.1, 150, 1.1, 0, 75, -7),
    box(1.1, 150, 1.1, 0, 75, 7),
  ];
  for (let i = 0; i < 7; i += 1) {
    flareParts.push(box(14, 0.5, 0.5, 0, 15 + i * 20, -7));
    flareParts.push(box(14, 0.5, 0.5, 0, 15 + i * 20, 7));
    flareParts.push(box(0.5, 0.5, 14, -7, 15 + i * 20, 0));
    flareParts.push(box(0.5, 0.5, 14, 7, 15 + i * 20, 0));
  }
  const flareTower = new THREE.Mesh(merge(flareParts), materials.darkSteel);
  flareTower.position.set(flareX, flareHeight, flareZ);
  flareTower.castShadow = true;
  flareTower.name = "flare-tower";
  stationGroup.add(flareTower);

  const flameGeometry = new THREE.ConeGeometry(8, 30, 12, 1, true);
  const flame = new THREE.Mesh(flameGeometry, materials.flame);
  flame.position.set(flareX, flareHeight + 158, flareZ);
  flame.layers.set(1);
  flame.name = "flare-flame";
  stationGroup.add(flame);
  const flameLight = new THREE.PointLight(0xff8a3d, 3.2, 900, 2);
  flameLight.position.set(flareX, flareHeight + 160, flareZ);
  stationGroup.add(flameLight);

  const smokeSprites: THREE.Sprite[] = [];
  for (let i = 0; i < 7; i += 1) {
    const material = materials.smoke.clone();
    material.opacity = 0.24 - i * 0.02;
    const sprite = new THREE.Sprite(material);
    sprite.position.set(flareX, flareHeight + 190 + i * 14, flareZ);
    sprite.scale.set(64 + i * 10, 64 + i * 10, 1);
    sprite.userData.offset = i / 7;
    stationGroup.add(sprite);
    smokeSprites.push(sprite);
  }

  group.add(buildRoads(field, heightAt));
  group.add(buildRocks(materials, heightAt));

  const beamPosition = new THREE.Vector3();
  const beamQuaternion = new THREE.Quaternion();
  const unitScale = new THREE.Vector3(1, 1, 1);
  const tempMatrix = new THREE.Matrix4();

  const update = (time: number, dt: number): void => {
    for (let index = 0; index < pumpMeta.length; index += 1) {
      const { well, top } = pumpMeta[index];
      const speed = well.status === "offline" ? 0 : well.status === "warning" ? 0.9 : 1.35;
      const phase = index * 0.73;
      const angle = speed === 0 ? 0.08 : Math.sin(time * speed + phase) * 0.16;
      const crankAngle = speed === 0 ? 0 : -Math.sin(time * speed + phase) * 1.35;

      beamPosition.set(well.pos.x, top + 6.8 * PUMP_SCALE, well.pos.z);
      beamQuaternion.setFromEuler(new THREE.Euler(0, well.rotation, angle, "YXZ"));
      tempMatrix.compose(beamPosition, beamQuaternion, unitScale);
      beamMesh.setMatrixAt(index, tempMatrix);

      beamPosition.set(well.pos.x, top + 2.8 * PUMP_SCALE, well.pos.z);
      beamQuaternion.setFromEuler(new THREE.Euler(0, well.rotation, crankAngle, "YXZ"));
      tempMatrix.compose(beamPosition, beamQuaternion, unitScale);
      crankMesh.setMatrixAt(index, tempMatrix);
    }
    beamMesh.instanceMatrix.needsUpdate = true;
    crankMesh.instanceMatrix.needsUpdate = true;

    flame.scale.set(0.9 + Math.sin(time * 6.4) * 0.12, 0.9 + Math.sin(time * 7.7 + 1.3) * 0.16, 0.9 + Math.cos(time * 5.9) * 0.12);
    flame.rotation.y = time * 0.8;
    flameLight.intensity = 2.8 + Math.sin(time * 8.1) * 0.6;

    smokeSprites.forEach((sprite) => {
      const offset = (time * 0.035 + (sprite.userData.offset as number)) % 1;
      sprite.position.y = flareHeight + 174 + offset * 150;
      const scale = 52 + offset * 120;
      sprite.scale.set(scale, scale, 1);
      (sprite.material as THREE.SpriteMaterial).opacity = (1 - offset) * 0.24;
      sprite.position.x = flareX + Math.sin(time * 0.7 + offset * 6) * 12;
    });
  };

  return {
    group,
    wellGroup,
    stationGroup,
    blockGroup,
    pickables,
    update,
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
