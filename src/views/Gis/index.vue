<script lang="ts">
export default { name: "Gis" };
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import * as Cesium from "cesium";
import GisHeader from "@/components/GisMap/panels/GisHeader.vue";
import GisLayerPanel from "@/components/GisMap/panels/GisLayerPanel.vue";
import GisDetailPanel from "@/components/GisMap/panels/GisDetailPanel.vue";
import GisToolbar from "@/components/GisMap/panels/GisToolbar.vue";
import { createFieldData, findFeature, pipelineStatusLabel } from "@/components/GisMap/data/field";
import { createRealtimeState, tickField } from "@/components/GisMap/data/realtime";
import type {
  Alarm,
  BlockRankingItem,
  FieldEvent,
  GisFeature,
  HeaderStats,
  LayerItem,
  SearchItem,
} from "@/components/GisMap/data/types";
import {
  createGisViewer,
  type BasemapMode,
  type GisViewerContext,
} from "@/components/GisMap/core/viewer";
import {
  createLayerManager,
  type LayerKey,
  type LayerManager,
} from "@/components/GisMap/managers/layerManager";
import {
  createMeasureManager,
  type MeasureManager,
} from "@/components/GisMap/managers/measure";
import { formatCoordinate, formatKm, groundCartesian } from "@/components/GisMap/core/geo";

const mapEl = ref<HTMLDivElement>();
const field = reactive(createFieldData());
const realtimeState = createRealtimeState();

const selectedId = ref<string | null>(null);
const layerVisibility = reactive<Record<LayerKey, boolean>>({
  block: true,
  well: true,
  platform: true,
  pipeline: true,
  trajectory: false,
});
const labelsVisible = ref(true);
const basemap = ref<BasemapMode>("dark");
const effectsOn = ref(true);
const realtimeOn = ref(true);
const measuring = ref(false);
const measureTotal = ref(0);
const is2D = ref(false);
const morphing = ref(false);
const toast = ref("");
const now = ref(new Date());
const coordinates = ref<{ lon: number; lat: number } | null>(null);
const cameraHeight = ref(0);
const events = ref<FieldEvent[]>([
  {
    id: "boot-1",
    ts: Date.now() - 4200,
    level: "info",
    sourceId: "system",
    sourceName: "系统",
    message: "气田三维场景加载完成",
  },
  {
    id: "boot-2",
    ts: Date.now() - 1200,
    level: "warning",
    sourceId: "W-003",
    sourceName: "彭州3井",
    message: "套压异常升高，进入预警监视",
  },
]);

const hover = reactive({
  visible: false,
  x: 0,
  y: 0,
  name: "",
  meta: "",
  kind: "",
});

let gis: GisViewerContext | null = null;
let manager: LayerManager | null = null;
let measure: MeasureManager | null = null;
let handler: Cesium.ScreenSpaceEventHandler | null = null;
let clockTimer = 0;
let tickTimer = 0;
let toastTimer = 0;

const selectedFeature = computed<GisFeature | null>(() =>
  selectedId.value ? findFeature(field, selectedId.value) ?? null : null,
);

const alarms = computed<Alarm[]>(() => {
  const list: Alarm[] = [];
  const ts = now.value.getTime();
  field.wells
    .filter((well) => well.status === "warning")
    .forEach((well) => {
      list.push({
        id: `alarm-well-${well.id}`,
        ts,
        level: "warning",
        sourceId: well.id,
        sourceName: well.name,
        message: `套压 ${well.pressure.toFixed(1)} MPa，超预警阈值`,
      });
    });
  field.pipelines
    .filter((pipeline) => pipeline.runStatus !== "running")
    .forEach((pipeline) => {
      list.push({
        id: `alarm-pipe-${pipeline.id}`,
        ts,
        level: pipeline.runStatus === "maintenance" ? "info" : "warning",
        sourceId: pipeline.id,
        sourceName: pipeline.name,
        message: pipeline.runStatus === "maintenance" ? "管线检修中" : "管线已停输",
      });
    });
  return list;
});

const headerStats = computed<HeaderStats>(() => ({
  wells: field.wells.length,
  openWells: field.wells.filter((well) => well.status !== "offline").length,
  gas: field.wells.reduce((total, well) => total + well.dailyGas, 0),
  pipelineKm: field.pipelines.reduce((total, pipeline) => total + pipeline.lengthKm, 0),
  alarms: alarms.value.length,
}));

const layerItems = computed<LayerItem[]>(() => [
  {
    key: "block",
    label: "区块边界",
    count: field.blocks.length,
    color: "#4d8dff",
    visible: layerVisibility.block,
  },
  {
    key: "well",
    label: "井位",
    count: field.wells.length,
    color: "#00e5ff",
    visible: layerVisibility.well,
  },
  {
    key: "platform",
    label: "平台",
    count: field.platforms.length,
    color: "#3cf5c8",
    visible: layerVisibility.platform,
  },
  {
    key: "pipeline",
    label: "集输管道",
    count: field.pipelines.length,
    color: "#b07cff",
    visible: layerVisibility.pipeline,
  },
  {
    key: "trajectory",
    label: "井下轨迹",
    count: field.wells.filter((well) => well.trajectory).length,
    color: "#ffd27a",
    visible: layerVisibility.trajectory,
  },
]);

const searchIndex = computed<SearchItem[]>(() => [
  ...field.blocks.map((block) => ({
    id: block.id,
    name: block.name,
    kind: "block" as const,
    sub: `${block.areaKm2} km² · ${block.wellCount} 口井`,
  })),
  ...field.wells.map((well) => ({
    id: well.id,
    name: well.name,
    kind: "well" as const,
    sub: `${well.wellType} · ${well.dailyGas.toFixed(1)} 万方/日`,
  })),
  ...field.platforms.map((platform) => ({
    id: platform.id,
    name: platform.name,
    kind: "platform" as const,
    sub: `${platform.type} · ${platform.wellIds.length} 口井`,
  })),
  ...field.pipelines.map((pipeline) => ({
    id: pipeline.id,
    name: pipeline.name,
    kind: "pipeline" as const,
    sub: `${pipeline.medium} · DN${pipeline.diameter}`,
  })),
]);

const blockRanking = computed<BlockRankingItem[]>(() => {
  const max = Math.max(...field.blocks.map((block) => block.dailyGas), 1);
  return [...field.blocks]
    .sort((a, b) => b.dailyGas - a.dailyGas)
    .map((block) => ({
      id: block.id,
      name: block.name,
      color: block.color,
      gas: block.dailyGas,
      percent: Math.max(4, (block.dailyGas / max) * 100),
    }));
});

const activeLayerCount = computed(
  () => Object.values(layerVisibility).filter((visible) => visible).length,
);

const clockText = computed(() => {
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${pad(now.value.getHours())}:${pad(now.value.getMinutes())}:${pad(now.value.getSeconds())}`;
});

const dateText = computed(() => {
  const pad = (value: number) => `${value}`.padStart(2, "0");
  const weeks = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${now.value.getFullYear()}-${pad(now.value.getMonth() + 1)}-${pad(now.value.getDate())} ${weeks[now.value.getDay()]}`;
});

const coordinateText = computed(() =>
  coordinates.value
    ? formatCoordinate(coordinates.value.lon, coordinates.value.lat)
    : "经纬度 —",
);

const cameraHeightLabel = computed(() => {
  if (cameraHeight.value >= 1000) return `${(cameraHeight.value / 1000).toFixed(1)} km`;
  return `${Math.max(0, Math.round(cameraHeight.value))} m`;
});

const totalLabel = computed(() => (measureTotal.value > 0 ? formatKm(measureTotal.value) : ""));

const tooltipStyle = computed(() => {
  const maxX = (typeof window === "undefined" ? 1280 : window.innerWidth) - 270;
  const maxY = (typeof window === "undefined" ? 720 : window.innerHeight) - 140;
  return {
    left: `${Math.max(12, Math.min(hover.x + 18, maxX))}px`,
    top: `${Math.max(12, Math.min(hover.y + 18, maxY))}px`,
  };
});

function kindLabel(feature: GisFeature): string {
  if (feature.kind === "block") return "区块";
  if (feature.kind === "well") return "井位";
  if (feature.kind === "platform") return "平台";
  return "管道";
}

function featureMeta(feature: GisFeature): string {
  if (feature.kind === "well") {
    const status =
      feature.status === "warning" ? "参数预警" : feature.status === "offline" ? "停产" : "运行正常";
    return `${feature.wellType} · ${status} · ${feature.dailyGas.toFixed(1)} 万方/日`;
  }
  if (feature.kind === "block") {
    return `${feature.areaKm2} km² · ${feature.wellCount} 口井 · ${feature.dailyGas.toFixed(1)} 万方/日`;
  }
  if (feature.kind === "platform") {
    return `${feature.type} · ${feature.wellIds.length} 口井 · ${feature.dailyGas.toFixed(1)} 万方/日`;
  }
  return `${feature.medium} · DN${feature.diameter} · ${feature.lengthKm.toFixed(1)} km · ${pipelineStatusLabel(feature.runStatus)}`;
}

function showToast(message: string) {
  toast.value = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value = "";
  }, 2200);
}

function selectFeature(id: string | null) {
  selectedId.value = id;
  manager?.select(id);
  hover.visible = false;
}

function focusFeature(id: string) {
  selectFeature(id);
  manager?.flyTo(id);
}

function handleSelectFromPanel(id: string) {
  focusFeature(id);
}

function handleToggleLayer(key: LayerKey, visible: boolean) {
  if (key === "trajectory" && visible && is2D.value) {
    showToast("井轨迹仅支持三维视图，请先切回 3D");
    return;
  }
  layerVisibility[key] = visible;
  manager?.setVisible(key, visible);
}

function handleToggleLabels(visible: boolean) {
  labelsVisible.value = visible;
  manager?.setLabels(visible);
}

function handleShowTrajectory(id: string) {
  if (is2D.value) {
    showToast("井轨迹仅支持三维视图，请先切回 3D");
    return;
  }
  if (!layerVisibility.trajectory) {
    layerVisibility.trajectory = true;
    manager?.setVisible("trajectory", true);
  }
  selectFeature(id);
  manager?.flyToWellUnderground(id);
}

function toggleTrajectory() {
  handleToggleLayer("trajectory", !layerVisibility.trajectory);
}

function toggleBasemap() {
  const next: BasemapMode = basemap.value === "dark" ? "satellite" : "dark";
  basemap.value = next;
  gis?.setBasemap(next);
  gis?.setBloom(effectsOn.value && next === "dark");
}

function toggleEffects() {
  effectsOn.value = !effectsOn.value;
  gis?.setBloom(effectsOn.value && basemap.value === "dark");
  manager?.setEffects(effectsOn.value);
}

function toggleRealtime() {
  realtimeOn.value = !realtimeOn.value;
  showToast(realtimeOn.value ? "实时模拟已开启" : "实时模拟已暂停");
}

function toggleMode() {
  if (!gis || morphing.value) return;
  if (measuring.value) stopMeasure();
  morphing.value = true;
  const target2D = !is2D.value;
  if (target2D && layerVisibility.trajectory) {
    layerVisibility.trajectory = false;
    manager?.setVisible("trajectory", false);
    showToast("二维视图已隐藏井轨迹");
  }
  manager?.setMode(target2D);
  gis.morph(target2D, () => {
    is2D.value = target2D;
    morphing.value = false;
    manager?.setMode(target2D);
    window.setTimeout(() => manager?.flyHome(), 120);
  });
}

function stopMeasure() {
  measuring.value = false;
  measureTotal.value = 0;
  measure?.stop();
}

function toggleMeasure() {
  if (measuring.value) {
    stopMeasure();
    return;
  }
  if (morphing.value) return;
  measure?.start();
  measuring.value = true;
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
  if (event.key !== "Escape") return;
  if (measuring.value) {
    stopMeasure();
    return;
  }
  if (selectedId.value) selectFeature(null);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    showToast("当前环境不支持全屏");
  }
}

type ClickEvent = { position: Cesium.Cartesian2 };
type MoveEvent = { endPosition: Cesium.Cartesian2 };

function setupHandler(viewer: Cesium.Viewer) {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  const canvas = viewer.scene.canvas;

  handler.setInputAction((event: ClickEvent) => {
    if (measuring.value) {
      const ground = groundCartesian(viewer, event.position);
      if (ground) measure?.addPoint(ground);
      return;
    }
    const id = manager?.pick(event.position) ?? null;
    selectFeature(id);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction((event: ClickEvent) => {
    if (measuring.value) {
      measure?.undo();
      measureTotal.value = measure?.getTotal() ?? 0;
    }
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

  let lastMove = 0;
  handler.setInputAction((event: MoveEvent) => {
    const timestamp = performance.now();
    if (timestamp - lastMove < 50) return;
    lastMove = timestamp;

    const ground = groundCartesian(viewer, event.endPosition);
    if (ground) {
      const cartographic = Cesium.Cartographic.fromCartesian(ground);
      if (cartographic) {
        coordinates.value = {
          lon: Cesium.Math.toDegrees(cartographic.longitude),
          lat: Cesium.Math.toDegrees(cartographic.latitude),
        };
      }
    }
    if (measuring.value) {
      measure?.setCursor(ground);
      hover.visible = false;
      canvas.style.cursor = "crosshair";
      return;
    }

    const id = manager?.pick(event.endPosition) ?? null;
    if (!id) {
      hover.visible = false;
      canvas.style.cursor = "default";
      return;
    }
    const feature = findFeature(field, id);
    if (!feature) {
      hover.visible = false;
      canvas.style.cursor = "default";
      return;
    }
    hover.visible = true;
    hover.x = event.endPosition.x;
    hover.y = event.endPosition.y;
    hover.name = feature.name;
    hover.kind = kindLabel(feature);
    hover.meta = featureMeta(feature);
    canvas.style.cursor = "pointer";
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

onMounted(() => {
  if (!mapEl.value) return;
  gis = createGisViewer(mapEl.value);
  gis.setBloom(effectsOn.value);
  manager = createLayerManager(gis, field);
  manager.setEffects(effectsOn.value);
  manager.flyHome();
  measure = createMeasureManager(gis.viewer, (total) => {
    measureTotal.value = total;
  });
  setupHandler(gis.viewer);

  clockTimer = window.setInterval(() => {
    now.value = new Date();
    if (gis) cameraHeight.value = gis.viewer.camera.positionCartographic?.height ?? 0;
  }, 1000);

  tickTimer = window.setInterval(() => {
    if (!realtimeOn.value) return;
    const result = tickField(field, realtimeState);
    if (result.events.length) {
      events.value = [...result.events, ...events.value].slice(0, 30);
    }
    manager?.syncAll();
    manager?.pulseWells(result.changedWellIds);
    gis?.viewer.scene.requestRender();
  }, 3000);

  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.clearInterval(clockTimer);
  window.clearInterval(tickTimer);
  window.clearTimeout(toastTimer);
  window.removeEventListener("keydown", onKeydown);
  handler?.destroy();
  handler = null;
  measure?.destroy();
  measure = null;
  manager?.destroy();
  manager = null;
  gis?.destroy();
  gis = null;
});
</script>

<template>
  <div class="gis-page" :class="{ 'is-measuring': measuring }" @contextmenu.prevent>
    <div ref="mapEl" class="gis-canvas"></div>
    <div class="gis-scanlines" aria-hidden="true"></div>

    <div class="gis-overlay">
      <GisHeader
        :stats="headerStats"
        :clock="clockText"
        :date="dateText"
        :realtime-on="realtimeOn"
      />

      <aside class="gis-left">
        <GisLayerPanel
          :layers="layerItems"
          :labels-visible="labelsVisible"
          :index="searchIndex"
          :events="events"
          @toggle-layer="handleToggleLayer"
          @toggle-labels="handleToggleLabels"
          @select="handleSelectFromPanel"
        />
      </aside>

      <aside class="gis-right">
        <GisDetailPanel
          :feature="selectedFeature"
          :field="field"
          :block-ranking="blockRanking"
          :alarms="alarms"
          :is2D="is2D"
          @close="selectFeature(null)"
          @focus="focusFeature"
          @select="handleSelectFromPanel"
          @show-trajectory="handleShowTrajectory"
        />
      </aside>

      <div class="gis-bottom">
        <GisToolbar
          :is2D="is2D"
          :measuring="measuring"
          :trajectory-on="layerVisibility.trajectory"
          :basemap="basemap"
          :effects-on="effectsOn"
          :realtime-on="realtimeOn"
          :morphing="morphing"
          :total-label="totalLabel"
          @reset="manager?.flyHome()"
          @toggle-measure="toggleMeasure"
          @toggle-mode="toggleMode"
          @toggle-trajectory="toggleTrajectory"
          @toggle-basemap="toggleBasemap"
          @toggle-effects="toggleEffects"
          @toggle-realtime="toggleRealtime"
          @fullscreen="toggleFullscreen"
        />
      </div>

      <footer class="gis-statusbar">
        <div class="gis-status-left">
          <span class="gis-status-led"></span>
          <span>演示数据 · 实时模拟</span>
          <span class="gis-status-sep"></span>
          <span>{{ coordinateText }}</span>
        </div>
        <div class="gis-status-right">
          <span>相机高度 {{ cameraHeightLabel }}</span>
          <span class="gis-status-sep"></span>
          <span>{{ is2D ? "2D 平面视图" : "3D 球面视图" }}</span>
          <span class="gis-status-sep"></span>
          <span>图层 {{ activeLayerCount }} / 5</span>
          <span class="gis-status-sep"></span>
          <span>AUTO REFRESH 3s</span>
        </div>
      </footer>

      <transition name="gis-toast">
        <div v-if="toast" class="gis-toast">{{ toast }}</div>
      </transition>
    </div>

    <div v-show="hover.visible" class="gis-tooltip" :style="tooltipStyle">
      <span class="gis-tooltip-kind">{{ hover.kind }}</span>
      <strong>{{ hover.name }}</strong>
      <p>{{ hover.meta }}</p>
      <small>点击查看详情</small>
    </div>
  </div>
</template>

<style lang="scss">
@use "@/components/GisMap/styles/gis.scss";
</style>
