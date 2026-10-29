import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { FieldData, Pipeline, Station } from "../data/types";
import { pipelineMediumLabel } from "../data/chuanxi";

interface LabelEntry {
  id: string;
  kind: "well" | "station" | "pipeline" | "block";
  object: CSS2DObject;
  element: HTMLDivElement;
  nameElement: HTMLElement;
  metricElement: HTMLElement;
  distanceLimit: number;
}

export interface LabelSystem {
  render(camera: THREE.PerspectiveCamera): void;
  update(camera: THREE.PerspectiveCamera, range: number): void;
  updateField(field: FieldData): void;
  setSelected(id: string | null): void;
  setAlarms(ids: string[]): void;
  setEnabled(visible: boolean): void;
  setKindEnabled(kind: LabelEntry["kind"], visible: boolean): void;
  getVisibleCount(): number;
  dispose(): void;
}

function colorForKey(key: string): string {
  return `var(--af-${key}, var(--af-primary))`;
}

function wellColor(kind: string, status: string): string {
  if (status === "warning") return "var(--af-warning)";
  if (status === "offline") return "var(--af-ink-muted)";
  if (kind === "gas") return "var(--af-gas)";
  if (kind === "water") return "var(--af-water)";
  if (kind === "observation") return "var(--af-info)";
  return "var(--af-oil)";
}

function pipelineColor(medium: string, status: string): string {
  if (status === "maintenance") return "var(--af-warning)";
  if (status === "stopped") return "var(--af-ink-muted)";
  if (medium === "gas") return "var(--af-gas)";
  if (medium === "water") return "var(--af-water)";
  return "var(--af-oil)";
}

function wellMetric(well: { metrics: { gas: number }; status: string }): string {
  return well.status === "offline" ? "停产" : `日产气 ${well.metrics.gas.toFixed(1)} 万m³/d`;
}

function stationMetric(station: Station): string {
  if (station.medium === "rawGas") return `处理 ${station.throughput.toFixed(1)} 万m³/d`;
  if (station.medium === "sweetGas") return `外输 ${station.throughput.toFixed(1)} 万m³/d`;
  if (station.medium === "water") return `处理 ${station.throughput.toFixed(0)} m³/d`;
  if (station.type === "中心控制站") return `监控 ${station.wellIds.length} 口井`;
  return "应急值守";
}

function pipelineMetric(pipeline: Pipeline): string {
  if (pipeline.service === "producedWater") {
    return `${pipelineMediumLabel(pipeline)} · ${pipeline.flow.toFixed(0)} m³/d`;
  }
  return `${pipelineMediumLabel(pipeline)} · ${pipeline.flow.toFixed(1)} 万m³/d`;
}

function createElement(color: string): {
  anchor: HTMLDivElement;
  name: HTMLElement;
  metric: HTMLElement;
} {
  const anchor = document.createElement("div");
  anchor.className = "af-scene-label-anchor";
  const pill = document.createElement("div");
  pill.className = "af-scene-label";
  pill.style.setProperty("--label-color", color);
  const dot = document.createElement("span");
  dot.className = "af-scene-label__dot";
  const copy = document.createElement("div");
  copy.className = "af-scene-label__copy";
  const name = document.createElement("strong");
  const metric = document.createElement("span");
  copy.appendChild(name);
  copy.appendChild(metric);
  pill.appendChild(dot);
  pill.appendChild(copy);
  anchor.appendChild(pill);
  return { anchor, name, metric };
}

export function createLabelSystem(
  host: HTMLElement,
  parent: THREE.Object3D,
  field: FieldData,
  scene: THREE.Scene,
  onActivate?: (id: string, kind: LabelEntry["kind"]) => void,
): LabelSystem {
  const renderer = new CSS2DRenderer();
  renderer.setSize(1920, 1080);
  renderer.domElement.className = "af-label-renderer";
  host.appendChild(renderer.domElement);

  const entries: LabelEntry[] = [];
  const byId = new Map<string, LabelEntry>();
  let selectedId: string | null = null;
  let alarmIds = new Set<string>();
  let enabled = true;
  const kindEnabled: Record<LabelEntry["kind"], boolean> = {
    well: true,
    station: true,
    pipeline: true,
    block: true,
  };
  let lastVisibilityCheck = 0;

  const register = (
    id: string,
    kind: LabelEntry["kind"],
    x: number,
    y: number,
    z: number,
    name: string,
    metric: string,
    color: string,
    distanceLimit: number,
  ): void => {
    const element = createElement(color);
    const pill = element.anchor.querySelector<HTMLElement>(".af-scene-label");
    if (kind === "block") {
      pill?.classList.add("is-block");
    }
    if (pill && onActivate) {
      pill.tabIndex = 0;
      pill.setAttribute("role", "button");
      pill.title = "点击聚焦";
      const activate = (event: Event): void => {
        event.stopPropagation();
        onActivate(id, kind);
      };
      pill.addEventListener("click", activate);
      pill.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate(event);
      });
    }
    element.name.textContent = name;
    element.metric.textContent = metric;
    const object = new CSS2DObject(element.anchor);
    object.position.set(x, y, z);
    object.name = `label-${id}`;
    parent.add(object);
    const entry: LabelEntry = {
      id,
      kind,
      object,
      element: element.anchor,
      nameElement: element.name,
      metricElement: element.metric,
      distanceLimit,
    };
    entries.push(entry);
    byId.set(id, entry);
  };

  for (const well of field.wells) {
    register(
      well.id,
      "well",
      well.pos.x,
      70,
      well.pos.z,
      well.name,
      wellMetric(well),
      wellColor(well.kind, well.status),
      12_000,
    );
  }

  for (const station of field.stations) {
    register(
      station.id,
      "station",
      station.pos.x,
      118,
      station.pos.z,
      station.name,
      stationMetric(station),
      "var(--af-primary)",
      20_000,
    );
  }

  for (const block of field.blocks) {
    register(
      block.id,
      "block",
      block.center.x,
      58,
      block.center.z,
      block.name,
      `日产气 ${block.dailyGas.toFixed(1)} 万m³/d`,
      colorForKey(block.colorKey),
      30_000,
    );
  }

  field.pipelines.forEach((pipeline, index) => {
    // 管线标签沿路径错开取点，避免多条管线在站场附近的中点叠在一起。
    const ratio = 0.38 + (index % 4) * 0.08;
    const anchor = pipeline.path[Math.min(
      pipeline.path.length - 1,
      Math.max(0, Math.round((pipeline.path.length - 1) * ratio)),
    )];
    register(
      pipeline.id,
      "pipeline",
      anchor.x,
      54,
      anchor.z,
      pipeline.name,
      pipelineMetric(pipeline),
      pipelineColor(pipeline.medium, pipeline.status),
      18_000,
    );
  });

  const updateField = (data: FieldData): void => {
    for (const well of data.wells) {
      const entry = byId.get(well.id);
      if (!entry) continue;
      entry.metricElement.textContent = wellMetric(well);
      entry.element.style.setProperty("--label-color", wellColor(well.kind, well.status));
    }
    for (const station of data.stations) {
      const entry = byId.get(station.id);
      if (!entry) continue;
      entry.metricElement.textContent = stationMetric(station);
    }
    for (const block of data.blocks) {
      const entry = byId.get(block.id);
      if (!entry) continue;
      entry.metricElement.textContent = `日产气 ${block.dailyGas.toFixed(1)} 万m³/d`;
    }
    for (const pipeline of data.pipelines) {
      const entry = byId.get(pipeline.id);
      if (!entry) continue;
      entry.metricElement.textContent = pipelineMetric(pipeline);
      entry.element.style.setProperty("--label-color", pipelineColor(pipeline.medium, pipeline.status));
    }
  };

  const setSelected = (id: string | null): void => {
    selectedId = id;
    entries.forEach((entry) => {
      entry.element.classList.toggle("is-selected", entry.id === selectedId);
    });
  };

  const setAlarms = (ids: string[]): void => {
    alarmIds = new Set(ids);
    entries.forEach((entry) => {
      entry.element.classList.toggle("is-alarm", alarmIds.has(entry.id));
    });
  };

  const world = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const center = new THREE.Vector3(0, 0, 0);
  const cameraPosition = new THREE.Vector3();
  const labelDirection = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const ranked: {
    entry: LabelEntry;
    distance: number;
    forced: boolean;
    screenX: number;
    screenY: number;
  }[] = [];
  const shownBoxes: { left: number; right: number; top: number; bottom: number }[] = [];

  const update = (camera: THREE.PerspectiveCamera, range: number): void => {
    const now = performance.now();
    if (now - lastVisibilityCheck < 160) return;
    lastVisibilityCheck = now;

    camera.getWorldPosition(cameraPosition);
    cameraDirection.copy(cameraPosition).sub(center).normalize();
    ranked.length = 0;
    shownBoxes.length = 0;

    for (const entry of entries) {
      const forced =
        entry.id === selectedId ||
        alarmIds.has(entry.id) ||
        entry.kind === "block";
      if (!enabled || !kindEnabled[entry.kind]) {
        entry.object.visible = false;
        continue;
      }
      if (range > 16_000 && !forced) {
        entry.object.visible = false;
        continue;
      }
      entry.object.getWorldPosition(world);
      const distance = cameraPosition.distanceTo(world);
      if (!forced && distance > entry.distanceLimit) {
        entry.object.visible = false;
        continue;
      }
      labelDirection.copy(world).sub(center).normalize();
      if (!forced && labelDirection.dot(cameraDirection) < -0.16) {
        entry.object.visible = false;
        continue;
      }
      projected.copy(world).project(camera);
      const screenX = (projected.x * 0.5 + 0.5) * 1920;
      const screenY = (-projected.y * 0.5 + 0.5) * 1080;
      if (!forced && (screenX < -80 || screenX > 2000 || screenY < 70 || screenY > 1010)) {
        entry.object.visible = false;
        continue;
      }
      ranked.push({ entry, distance, forced, screenX, screenY });
    }

    const priorityOf = (item: (typeof ranked)[number]): number => {
      if (item.entry.id === selectedId) return 0;
      // 区块是 GIS 底图骨架，先让区块名占位，再显示告警 / 设施标签。
      if (item.entry.kind === "block") return 1;
      if (alarmIds.has(item.entry.id)) return 2;
      return 3;
    };
    ranked.sort((a, b) => {
      if (a.forced !== b.forced) return a.forced ? -1 : 1;
      const priorityA = priorityOf(a);
      const priorityB = priorityOf(b);
      if (priorityA !== priorityB) return priorityA - priorityB;
      // 普通标签里管线优先露出，避免线路标签总被井/站挤掉。
      const pipelineA = a.entry.kind === "pipeline" ? 0 : 1;
      const pipelineB = b.entry.kind === "pipeline" ? 0 : 1;
      if (pipelineA !== pipelineB) return pipelineA - pipelineB;
      return a.distance - b.distance;
    });

    // 重点标签（区块 / 关键对象 / 选中 / 告警）不占普通标签名额，避免它们挤掉周边设施标签。
    const maxLabels = range < 3000 ? 12 : 9;
    const maxPipelines = range < 3000 ? 6 : 4;
    const labelHalfWidth = 67;
    const labelHalfHeight = 14;
    let ordinaryShown = 0;
    let pipelineShown = 0;
    ranked.forEach((item) => {
      if (!item.forced && ordinaryShown >= maxLabels) {
        item.entry.object.visible = false;
        return;
      }
      if (!item.forced && item.entry.kind === "pipeline" && pipelineShown >= maxPipelines) {
        item.entry.object.visible = false;
        return;
      }
      const box = {
        left: item.screenX - labelHalfWidth,
        right: item.screenX + labelHalfWidth,
        top: item.screenY - labelHalfHeight,
        bottom: item.screenY + labelHalfHeight,
      };
      const overlaps = shownBoxes.some(
        (other) =>
          box.left < other.right &&
          box.right > other.left &&
          box.top < other.bottom &&
          box.bottom > other.top,
      );
      // 重点标签也不能互相压字；排序已保证选中 / 告警 / 关键对象先占位。
      if (overlaps) {
        item.entry.object.visible = false;
        return;
      }
      item.entry.object.visible = true;
      shownBoxes.push(box);
      if (!item.forced) ordinaryShown += 1;
    });
  };

  return {
    render: (camera: THREE.PerspectiveCamera) => {
      renderer.render(scene, camera);
    },
    update,
    updateField,
    setSelected,
    setAlarms,
    setEnabled: (visible: boolean) => {
      enabled = visible;
      if (!visible) entries.forEach((entry) => (entry.object.visible = false));
    },
    setKindEnabled: (kind: LabelEntry["kind"], visible: boolean) => {
      kindEnabled[kind] = visible;
      if (!visible) {
        entries
          .filter((entry) => entry.kind === kind)
          .forEach((entry) => (entry.object.visible = false));
      }
    },
    getVisibleCount: () => entries.filter((entry) => entry.object.visible).length,
    dispose: () => {
      entries.forEach((entry) => {
        entry.object.removeFromParent();
        entry.object.element.remove();
      });
      entries.length = 0;
      renderer.domElement.remove();
    },
  };
}
