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

function buildWellheadGeometry(): THREE.BufferGeometry {
  return merge([
    cylinder(3.4, 4.0, 1.2, 12, 0, 0.6, 0),
    cylinder(1.2, 1.5, 5.4, 10, 0, 3.9, 0),
    box(4.2, 0.9, 4.2, 0, 7.0, 0),
    cylinder(0.8, 0.8, 4.4, 8, 2.6, 7.1, 0, 0, 0, Math.PI / 2),
    cylinder(0.8, 0.8, 4.4, 8, -2.6, 7.1, 0, 0, 0, Math.PI / 2),
    box(1.1, 3.2, 1.1, 0, 9.2, 0),
    cylinder(0.6, 0.8, 2.0, 8, 0, 11.2, 0),
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

function buildBlockBoundaries(field: FieldData, palette: ScenePalette): {
  group: THREE.Group;
  materials: THREE.LineDashedMaterial[];
} {
  const group = new THREE.Group();
  group.name = "block-boundaries";
  const materials: THREE.LineDashedMaterial[] = [];

  for (const block of field.blocks) {
    const points: THREE.Vector3[] = [];
    const count = 96;
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
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: new THREE.Color(palette.blockLine),
      transparent: true,
      opacity: 0.45,
      dashSize: 42,
      gapSize: 24,
      depthWrite: false,
    });
    materials.push(material);
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.name = `block-${block.id}`;
    group.add(line);
  }

  return { group, materials };
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
    const padGeometry = new THREE.BoxGeometry(520, 1.2, 360);
    const padMatrices = platforms.map((platform) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(platform.pos.x, heightAt(platform.pos.x, platform.pos.z) + 0.1, platform.pos.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    const pads = instanced(padGeometry, materials.concrete, padMatrices);
    pads.receiveShadow = true;
    pads.name = "platform-pads";
    wellGroup.add(pads);

    const skidGeometry = new THREE.BoxGeometry(30, 3, 12);
    const skidMatrices = platforms.map((platform) =>
      new THREE.Matrix4().compose(
        new THREE.Vector3(platform.pos.x + 40, heightAt(platform.pos.x, platform.pos.z) + 2.4, platform.pos.z - 40),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    const skids = instanced(skidGeometry, materials.steel, skidMatrices);
    skids.castShadow = true;
    skids.receiveShadow = true;
    skids.name = "platform-skids";
    wellGroup.add(skids);
  }

  const wellPadGeometry = new THREE.CylinderGeometry(22, 24, 1.2, 16);
  const wellPadMatrices: THREE.Matrix4[] = [];
  const wellheadMatrices: THREE.Matrix4[] = [];
  const wellIds: string[] = [];
  for (const well of field.wells) {
    const y = heightAt(well.pos.x, well.pos.z);
    wellPadMatrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(well.pos.x, y + 0.6, well.pos.z),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    wellheadMatrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(well.pos.x, y + 1.2, well.pos.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), well.rotation),
        new THREE.Vector3(1, 1, 1),
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

  for (const station of field.stations) {
    stationGroup.add(createStation(station, materials, heightAt, pickables));
  }

  const boundaries = buildBlockBoundaries(field, palette);
  blockGroup.add(boundaries.group);
  localMaterials.push(...boundaries.materials);

  const applyTheme = (next: ScenePalette): void => {
    boundaries.materials.forEach((material) => {
      material.color.set(next.blockLine);
    });
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
    applyTheme,
    dispose: () => {
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      localMaterials.forEach((material) => material.dispose());
    },
  };
}
