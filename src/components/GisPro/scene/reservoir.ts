import * as THREE from "three";
import type { FieldData, Reservoir, Well } from "../data/types";
import type { SceneMaterials } from "../fx/materials";
import { SECTOR_LENGTH, SECTOR_START } from "./terrain";
import { TOKENS } from "../styles/tokens";

export interface ReservoirSystem {
  group: THREE.Group;
  update(progress: number, time: number): void;
  setSelected(id: string | null): void;
  dispose(): void;
}

interface LayerVisual {
  mesh: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  edge: THREE.Line;
  innerEdge: THREE.Line;
  baseY: number;
  index: number;
}

function reservoirDepth(reservoirId: string): number {
  if (reservoirId === "R1") return -132;
  if (reservoirId === "R2") return -296;
  return -424;
}

function layerColor(reservoir: Reservoir): THREE.Color {
  const colors = TOKENS.colors as Record<string, string>;
  return new THREE.Color(colors[reservoir.colorKey] ?? TOKENS.colors.oil);
}

function buildLayer(reservoir: Reservoir, index: number): LayerVisual {
  const radius = 1480 - index * 190;
  const thickness = index === 0 ? 34 : index === 1 ? 40 : 34;
  const color = layerColor(reservoir);
  const geometry = new THREE.CylinderGeometry(
    radius,
    radius,
    thickness,
    72,
    1,
    true,
    SECTOR_START,
    SECTOR_LENGTH,
  );
  const material = new THREE.MeshPhysicalMaterial({
    color,
    emissive: color.clone().multiplyScalar(0.2),
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.14,
    roughness: 0.5,
    metalness: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const baseY = reservoirDepth(reservoir.id);
  mesh.position.y = baseY;
  mesh.name = `reservoir-${reservoir.id}`;

  const points: THREE.Vector3[] = [];
  const segments = 100;
  for (let i = 0; i <= segments; i += 1) {
    const angle = SECTOR_START + (SECTOR_LENGTH * i) / segments;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        baseY + thickness / 2 + 2,
        -Math.sin(angle) * radius,
      ),
    );
  }
  const edge = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  edge.layers.set(1);

  const innerEdge = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      points.map(
        (point) =>
          new THREE.Vector3(point.x * 0.97, point.y - thickness - 4, point.z * 0.97),
      ),
    ),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  innerEdge.layers.set(1);

  return { mesh, material, edge, innerEdge, baseY, index };
}

function buildWellbore(
  well: Well,
  reservoirId: string,
  materials: SceneMaterials,
  highlight = false,
): THREE.Group {
  const group = new THREE.Group();
  const depth = reservoirDepth(reservoirId);
  const lateral = well.lateralLength;
  const lateralLength = lateral > 0 ? Math.max(260, lateral) : 0;
  const dx = Math.cos(well.azimuth) * lateralLength;
  const dz = Math.sin(well.azimuth) * lateralLength;
  const start = new THREE.Vector3(well.pos.x, 2, well.pos.z);
  const mid = new THREE.Vector3(well.pos.x, depth * 0.62, well.pos.z);
  const bend =
    lateralLength > 0
      ? new THREE.Vector3(well.pos.x + dx * 0.22, depth + 8, well.pos.z + dz * 0.22)
      : new THREE.Vector3(well.pos.x, depth * 0.86, well.pos.z);
  const end =
    lateralLength > 0
      ? new THREE.Vector3(well.pos.x + dx, depth + 8, well.pos.z + dz)
      : new THREE.Vector3(well.pos.x, depth + 8, well.pos.z);
  const curve = new THREE.CatmullRomCurve3([start, mid, bend, end]);
  const geometry = new THREE.TubeGeometry(curve, 48, highlight ? 1.9 : 1.3, 5, false);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(highlight ? TOKENS.colors.oil : TOKENS.colors.primary),
    transparent: true,
    opacity: highlight ? 0.9 : 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const tube = new THREE.Mesh(geometry, material);
  tube.layers.set(1);
  group.add(tube);

  const fracturePositions: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const angle = well.azimuth + (i - 3) * 0.34;
    const length = 30 + (i % 3) * 24;
    fracturePositions.push(end.x, end.y, end.z);
    fracturePositions.push(
      end.x + Math.cos(angle) * length,
      end.y + Math.sin(i * 0.8) * 14,
      end.z + Math.sin(angle) * length,
    );
  }
  const fractureGeometry = new THREE.BufferGeometry();
  fractureGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(fracturePositions, 3),
  );
  const fractureMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(highlight ? TOKENS.colors.oil : TOKENS.colors.primary),
    transparent: true,
    opacity: highlight ? 0.42 : 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fractures = new THREE.LineSegments(fractureGeometry, fractureMaterial);
  fractures.layers.set(1);
  group.add(fractures);

  group.name = `wellbore-${well.id}`;
  return group;
}

export function createReservoirSystem(
  field: FieldData,
  materials: SceneMaterials,
): ReservoirSystem {
  const group = new THREE.Group();
  group.name = "reservoir-system";
  group.visible = false;

  const wellbores: THREE.Group[] = [];
  const lateralWells = field.wells.filter((well) => well.lateralLength > 0).slice(0, 3);
  lateralWells.forEach((well, index) => {
    const reservoirId = index % 3 === 0 ? "R1" : index % 3 === 1 ? "R2" : "R3";
    const bore = buildWellbore(well, reservoirId, materials);
    group.add(bore);
    wellbores.push(bore);
  });

  let selectedBore: THREE.Group | null = null;

  const clearSelectedBore = (): void => {
    if (!selectedBore) return;
    selectedBore.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
    });
    group.remove(selectedBore);
    selectedBore = null;
  };

  const setSelected = (id: string | null): void => {
    clearSelectedBore();
    if (!id) return;
    const well = field.wells.find((item) => item.id === id);
    if (!well) return;
    selectedBore = buildWellbore(well, well.reservoirId, materials, true);
    selectedBore.name = `selected-bore-${id}`;
    group.add(selectedBore);
  };

  const update = (progress: number, time: number): void => {
    group.visible = progress > 0.02;
    if (!group.visible) return;
    const backgroundOpacity = Math.max(0.04, progress) * 0.2;
    wellbores.forEach((bore, index) => {
      bore.visible = progress > 0.22;
      bore.traverse((object) => {
        const material = (object as THREE.Mesh).material;
        if (material && "opacity" in material) {
          (material as THREE.Material & { opacity: number }).opacity =
            backgroundOpacity * (0.8 + (index % 3) * 0.1);
        }
      });
    });
    if (selectedBore) {
      selectedBore.visible = progress > 0.22;
      const selectedOpacity = Math.max(0.2, progress) * 0.88;
      selectedBore.traverse((object) => {
        const material = (object as THREE.Mesh).material;
        if (material && "opacity" in material) {
          (material as THREE.Material & { opacity: number }).opacity = selectedOpacity;
        }
      });
    }
    group.rotation.y = Math.sin(time * 0.12) * 0.005;
  };

  return {
    group,
    update,
    setSelected,
    dispose: () => {
      clearSelectedBore();
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
