import * as THREE from "three";
import type { FieldData, Pipeline } from "../data/types";
import type { SceneMaterials } from "../fx/materials";
import type { ScenePalette } from "../styles/tokens";

export interface PipelineSystem {
  group: THREE.Group;
  pickables: THREE.Object3D[];
  update(time: number): void;
  refresh(field: FieldData): void;
  setSelected(id: string | null): void;
  applyTheme(palette: ScenePalette): void;
  dispose(): void;
}

interface PipelineMesh {
  pipeline: Pipeline;
  mesh: THREE.Mesh;
  baseMaterial: THREE.Material;
}

function baseMaterial(materials: SceneMaterials, pipeline: Pipeline): THREE.Material {
  if (pipeline.status === "maintenance") return materials.pipeMaintenance;
  if (pipeline.status === "stopped") return materials.pipeStopped;
  return pipeline.medium === "water" ? materials.pipeWater : materials.pipeGas;
}

export function createPipelineSystem(
  field: FieldData,
  materials: SceneMaterials,
  heightAt: (x: number, z: number) => number,
): PipelineSystem {
  const group = new THREE.Group();
  group.name = "pipelines";
  const pickables: THREE.Object3D[] = [];
  const meshes: PipelineMesh[] = [];
  let selectedId: string | null = null;

  for (const pipeline of field.pipelines) {
    const points = pipeline.path.map(
      (point) => new THREE.Vector3(point.x, heightAt(point.x, point.z) + 5, point.z),
    );
    if (points.length < 2) continue;
    const curve = new THREE.CatmullRomCurve3(points);
    const radius = pipeline.medium === "water" ? 2.2 : 2.8;
    const geometry = new THREE.TubeGeometry(curve, 72, radius, 6, false);
    const material = baseMaterial(materials, pipeline);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = pipeline.id;
    mesh.userData.id = pipeline.id;
    mesh.userData.kind = "pipeline";
    group.add(mesh);
    pickables.push(mesh);
    meshes.push({ pipeline, mesh, baseMaterial: material });
  }

  return {
    group,
    pickables,
    update: () => {
      // 实体管线不做流动画；流向由详情卡与标签表达。
    },
    refresh: (data: FieldData) => {
      for (const entry of meshes) {
        const latest = data.pipelines.find((item) => item.id === entry.pipeline.id);
        if (!latest) continue;
        entry.pipeline = latest;
        entry.baseMaterial = baseMaterial(materials, latest);
        entry.mesh.material =
          latest.id === selectedId ? materials.pipeSelected : entry.baseMaterial;
      }
    },
    setSelected: (id: string | null) => {
      selectedId = id;
      for (const entry of meshes) {
        entry.mesh.material = id === entry.pipeline.id ? materials.pipeSelected : entry.baseMaterial;
      }
    },
    applyTheme: () => {
      // 管线材质由 threeStage 的 SceneMaterials 统一更新。
    },
    dispose: () => {
      meshes.forEach((entry) => entry.mesh.geometry.dispose());
    },
  };
}
