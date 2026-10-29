<script lang="ts">
export default { name: "GisPro" };
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { DebugInfo, GisProEngineApi, QualityLevel } from "@/components/GisPro/core/api";
import { createEngine } from "@/components/GisPro/core/engine";
import { createFieldData } from "@/components/GisPro/data/chuanxi";
import type { HoverInfo } from "@/components/GisPro/data/types";
import { tokenCssVars } from "@/components/GisPro/styles/tokens";
import AfIcon from "@/components/GisPro/ui/AfIcon.vue";
import AlarmFeed from "@/components/GisPro/ui/AlarmFeed.vue";
import DetailCard from "@/components/GisPro/ui/DetailCard.vue";
import HudHeader from "@/components/GisPro/ui/HudHeader.vue";
import LayerLegend from "@/components/GisPro/ui/LayerLegend.vue";
import ProductionPanel from "@/components/GisPro/ui/ProductionPanel.vue";
import QuickSearch from "@/components/GisPro/ui/QuickSearch.vue";
import TourBar from "@/components/GisPro/ui/TourBar.vue";
import {
  actions,
  applySnapshot,
  bindEngine,
  initStore,
  setCaption,
  setCamera,
  setClock,
  setFps,
  setHover,
  setImagery,
  setLayerState,
  setReady,
  setSceneMode,
  setSelected,
  setTour,
  setTourProgress,
  setTourTrajectory,
  showToast,
  state,
  unbindEngine,
} from "@/components/GisPro/ui/store";

const field = createFieldData();
initStore(field);

const tokenVars = computed(() => tokenCssVars(state.theme));
const stageEl = ref<HTMLDivElement>();
const cesiumEl = ref<HTMLDivElement>();
const threeEl = ref<HTMLDivElement>();
const labelsEl = ref<HTMLDivElement>();
const compact = ref(false);
const sceneError = ref("");
const debugMode = new URLSearchParams(window.location.search).get("debug") === "1";
const debug = ref<DebugInfo | null>(null);
const qualityLevels: QualityLevel[] = ["high", "medium", "low"];

let engine: GisProEngineApi | null = null;
let clockTimer = 0;
let debugTimer = 0;
let resizeFrame = 0;

const emptyHover: HoverInfo = {
  visible: false,
  x: 0,
  y: 0,
  name: "",
  kindLabel: "",
  meta: "",
};

const hudLive = computed(() => state.ready);
const showLoader = computed(() => !state.ready || Boolean(sceneError.value));

const tooltipStyle = computed(() => {
  const x = Math.min(state.hover.x + 18, 1920 - 292);
  const y = Math.min(state.hover.y + 18, 1080 - 156);
  return { left: `${Math.max(12, x)}px`, top: `${Math.max(12, y)}px` };
});

const cameraHeight = computed(() => {
  const height = state.camera.height;
  if (height >= 100_000) return `${(height / 1000).toFixed(0)} km`;
  if (height >= 1000) return `${(height / 1000).toFixed(1)} km`;
  return `${Math.max(0, Math.round(height))} m`;
});

const imageryText = computed(() => {
  if (state.imagery === "esri") return "卫星影像";
  if (state.imagery === "gaode") return "高德影像";
  if (state.imagery === "local") return "本地";
  if (state.imagery === "offline") return "离线网格";
  return "连接中";
});

const visibleLayerCount = computed(
  () =>
    (["wells", "stations", "pipelines", "blocks", "labels"] as const).filter(
      (key) => state.layers[key],
    ).length,
);

function applyScale(): void {
  if (!stageEl.value) return;
  const width = window.visualViewport?.width ?? window.innerWidth;
  const height = window.visualViewport?.height ?? window.innerHeight;
  const scale = Math.max(0.3, Math.min(width / 1920, height / 1080));
  stageEl.value.style.setProperty("--af-scale", `${scale}`);
  compact.value = scale < 0.78;
}

function scheduleScale(): void {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(applyScale);
}

async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    showToast("当前环境不支持全屏");
  }
}

function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  ) {
    return;
  }

  // 交互式井轨迹只保留 Esc 与全屏；巡演中的井轨迹章节仍允许播放/下一章。
  if (
    state.sceneMode === "trajectory" &&
    !state.tourTrajectory &&
    event.key !== "Escape" &&
    event.key.toLowerCase() !== "f"
  ) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (state.tourPlaying) actions.pauseTour();
    else actions.playTour();
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    actions.nextChapter();
    return;
  }
  if (event.key === "Escape") {
    if (state.sceneMode === "trajectory") actions.closeWellTrajectory();
    else if (state.selected) actions.clearSelection();
    else if (state.tourPlaying) actions.pauseTour();
    return;
  }
  const key = event.key.toLowerCase();
  if (key === "l") actions.setLayer("labels", !state.layers.labels);
  if (key === "f") void toggleFullscreen();
}

function setQuality(quality: QualityLevel): void {
  actions.setQuality(quality);
  window.setTimeout(() => {
    if (engine && debugMode) debug.value = engine.getDebugInfo();
  }, 120);
}

onMounted(() => {
  applyScale();
  window.addEventListener("resize", scheduleScale);
  window.visualViewport?.addEventListener("resize", scheduleScale);
  window.addEventListener("keydown", onKeydown);
  setClock();
  clockTimer = window.setInterval(() => setClock(), 1000);

  if (!stageEl.value || !cesiumEl.value || !threeEl.value || !labelsEl.value) return;

  try {
    engine = createEngine(
      field,
      {
        stage: stageEl.value,
        cesium: cesiumEl.value,
        three: threeEl.value,
        labels: labelsEl.value,
      },
      {
        onReady: () => setReady(true),
        onTick: (stats, alarms) => applySnapshot(stats, alarms),
        onSelect: (detail) => setSelected(detail),
        onHover: (hover) => setHover(hover ?? emptyHover),
        onTour: (patch) =>
          setTour({
            playing: patch.playing,
            chapter: patch.chapter,
            canResume: patch.canResume,
          }),
        onTourProgress: (progress) => setTourProgress(progress),
        onCamera: (camera) => setCamera(camera),
        onImagery: (imagery) => setImagery(imagery),
        onSceneMode: (mode) => setSceneMode(mode),
        onTourTrajectory: (active) => setTourTrajectory(active),
        onCaption: (label, subtitle) => setCaption(label, subtitle),
        onLayer: (key, visible) => setLayerState(key, visible),
        onFps: (fps) => setFps(fps),
      },
      state.theme,
    );
    bindEngine(engine);
    if (debugMode) {
      debugTimer = window.setInterval(() => {
        if (engine) debug.value = engine.getDebugInfo();
      }, 1000);
    }
  } catch (error) {
    console.error("[GisPro] engine init failed", error);
    sceneError.value = error instanceof Error ? error.message : "WebGL 初始化失败";
    setReady(false);
    showToast("三维引擎初始化失败，请检查 WebGL2 支持");
  }
});

onBeforeUnmount(() => {
  window.clearInterval(clockTimer);
  window.clearInterval(debugTimer);
  window.cancelAnimationFrame(resizeFrame);
  window.removeEventListener("resize", scheduleScale);
  window.visualViewport?.removeEventListener("resize", scheduleScale);
  window.removeEventListener("keydown", onKeydown);
  engine?.destroy();
  engine = null;
  unbindEngine();
});
</script>

<template>
  <div
    class="af-page"
    :class="{
      'is-compact': compact,
      'is-live': hudLive,
      'is-trajectory': state.sceneMode === 'trajectory',
      'is-tour-trajectory': state.tourTrajectory,
    }"
    :data-theme="state.theme"
    :style="tokenVars"
  >
    <div class="af-stage" ref="stageEl" aria-label="川西气田生产运行监控大屏">
      <div class="af-cesium" ref="cesiumEl"></div>
      <div class="af-three" ref="threeEl"></div>
      <div class="af-labels" ref="labelsEl"></div>

      <div class="af-hud" :class="{ 'is-live': hudLive }">
        <HudHeader @fullscreen="toggleFullscreen" />

        <aside class="af-left">
          <QuickSearch />
          <LayerLegend />
          <ProductionPanel />
        </aside>

        <aside class="af-right">
          <AlarmFeed />
          <DetailCard />
        </aside>

        <div
          v-if="state.sceneMode === 'trajectory' && !state.tourTrajectory"
          class="af-trajectory-bar"
        >
          <div class="af-trajectory-bar__title">
            <span>单井井轨迹</span>
            <strong>{{ state.selected?.name ?? "单井" }}</strong>
            <em>
              {{ state.selected?.meta.find((item) => item.label === "井深")?.value ?? "" }}
              ·
              {{ state.selected?.meta.find((item) => item.label === "层位")?.value ?? "" }}
            </em>
          </div>
          <div class="af-trajectory-bar__hint">
            <i></i>
            地层柱 / 井眼轨迹 / 油藏层带
          </div>
          <button type="button" class="af-btn af-btn--ghost" @click="actions.closeWellTrajectory()">
            <AfIcon name="reset" :size="14" /> 返回气田
          </button>
        </div>

        <div class="af-bottom">
          <TourBar />
        </div>

        <footer class="af-status">
          <div class="af-status__left">
            <span class="af-status__led"></span>
            <span>103.9300°E / 31.0400°N</span>
            <i></i>
            <span>川西气田 · 演示数据</span>
          </div>
          <div class="af-status__center">
            <span>川西气田生产运行监控</span>
          </div>
          <div class="af-status__right">
            <span>视高 {{ cameraHeight }}</span>
            <i></i>
            <span>图层 {{ visibleLayerCount }} / 5</span>
            <i></i>
            <span>底图 {{ imageryText }}</span>
          </div>
        </footer>

        <transition name="af-tooltip">
          <div v-if="state.hover.visible" class="af-tooltip" :style="tooltipStyle">
            <span class="af-tooltip__kind">{{ state.hover.kindLabel }}</span>
            <strong>{{ state.hover.name }}</strong>
            <p>{{ state.hover.meta }}</p>
            <small>点击定位 · 悬停查看</small>
          </div>
        </transition>

        <transition name="af-toast">
          <div v-if="state.toast" class="af-toast">{{ state.toast }}</div>
        </transition>

        <div v-if="debugMode && debug" class="af-debug">
          <div><span>帧率</span><strong>{{ debug.fps }}</strong></div>
          <div><span>绘制</span><strong>{{ debug.drawCalls }}</strong></div>
          <div><span>三角面</span><strong>{{ debug.triangles.toLocaleString() }}</strong></div>
          <div><span>标签</span><strong>{{ debug.labels }}</strong></div>
          <div class="af-debug__quality">
            <button
              v-for="level in qualityLevels"
              :key="level"
              type="button"
              :class="{ 'is-active': debug.quality === level }"
              @click="setQuality(level)"
            >
              {{ level }}
            </button>
          </div>
        </div>
      </div>

      <transition name="af-fade">
        <div v-if="showLoader" class="af-loader">
          <div class="af-loader__brand">
            <AfIcon name="well" :size="26" />
          </div>
          <strong>川西气田</strong>
          <h2 v-if="!sceneError">正在加载三维场景</h2>
          <h2 v-else>三维引擎初始化失败</h2>
          <p v-if="!sceneError">卫星影像 · 场站模型 · 管网数据</p>
          <p v-else>{{ sceneError }}</p>
          <div v-if="!sceneError" class="af-loader__bar">
            <span></span>
          </div>
          <div v-if="!sceneError" class="af-loader__steps">
            <span>三维场景</span>
            <span>地质剖面</span>
            <span>管线拓扑</span>
            <span>空间相机</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style lang="scss">
@use "@/components/GisPro/styles/gispro.scss";
</style>
