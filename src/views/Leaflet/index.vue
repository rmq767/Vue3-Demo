<script lang="ts">
export default { name: "LeafletGis" };
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { buildFeatureDetail } from "@/components/GisPro/data/field";
import type { FeatureDetail, FeatureKind, SearchItem } from "@/components/GisPro/data/types";
import { tokenCssVars } from "@/components/GisPro/styles/tokens";
import AfIcon from "@/components/GisPro/ui/AfIcon.vue";
import { BASEMAPS, DEFAULT_BASEMAP, basemapDef } from "./baseMaps";
import DetailPanel from "./components/DetailPanel.vue";
import WellSection from "./components/WellSection.vue";
import { formatLonLat } from "./geo";
import type {
  BasemapKey,
  BasemapStatus,
  HoverPayload,
  LayerKey,
  LonLat,
} from "./types";
import { useLeafletField } from "./useLeafletField";

const tokenVars = tokenCssVars();
const mapEl = ref<HTMLDivElement>();
const ready = ref(false);
const selectedId = ref<string | null>(null);
const profileId = ref<string | null>(null);
const hover = ref<HoverPayload | null>(null);
const pointer = ref<LonLat | null>(null);
const zoom = ref(14);
const toast = ref("");
const clock = reactive({ time: "--:--:--", date: "" });
const basemap = reactive<{ key: BasemapKey; status: BasemapStatus }>({
  key: DEFAULT_BASEMAP,
  status: "loading",
});
const layers = reactive<Record<LayerKey, boolean>>({
  blocks: true,
  wells: true,
  stations: true,
  pipelines: true,
});
const labelsOn = ref(true);
const searchQuery = ref("");
const searchOpen = ref(false);
const searchActive = ref(0);
const searchInput = ref<HTMLInputElement>();

let clockTimer = 0;
let toastTimer = 0;
let searchBlurTimer = 0;

const scene = useLeafletField({
  onSelect(id) {
    selectedId.value = id;
    profileId.value = null;
    hover.value = null;
  },
  onHover(payload) {
    hover.value = payload;
  },
  onWellProfile(id) {
    profileId.value = id;
  },
  onBasemap(patch) {
    basemap.key = patch.key;
    basemap.status = patch.status;
  },
  onZoom(value) {
    zoom.value = value;
  },
  onPointer(point) {
    pointer.value = point;
  },
  onToast(message) {
    showToast(message);
  },
  onReady() {
    ready.value = true;
  },
});

const field = scene.field;
const stats = scene.stats;
const searchItems = scene.searchItems;

const selectedDetail = computed<FeatureDetail | null>(() =>
  selectedId.value ? buildFeatureDetail(field, selectedId.value) : null,
);

const profileWell = computed(() =>
  profileId.value ? field.wells.find((well) => well.id === profileId.value) ?? null : null,
);

const profileDetail = computed(() =>
  profileId.value ? buildFeatureDetail(field, profileId.value) : null,
);

const basemapMeta = computed(() => basemapDef(basemap.key));

const statusText = computed(() =>
  basemap.status === "ready" ? "在线" : basemap.status === "fallback" ? "本地网格" : "连接中",
);

const crsLabel = computed(() => (basemapMeta.value.crs === "gcj02" ? "GCJ02" : "WGS84"));

const creditText = computed(() =>
  basemap.status === "fallback" ? "本地网格 · GRID" : basemapMeta.value.credit,
);

const zoomText = computed(() => zoom.value.toFixed(1));

const pointerText = computed(() => formatLonLat(pointer.value ?? field.center));

const activeLayerCount = computed(
  () => Object.values(layers).filter(Boolean).length,
);

const kpis = computed(() => [
  { label: "日产油", value: stats.totalOil.toFixed(0), unit: "t/d", tone: "oil" },
  { label: "日产气", value: stats.totalGas.toFixed(1), unit: "万方/d", tone: "gas" },
  { label: "开井", value: `${stats.openWells}`, unit: `/ ${stats.totalWells}`, tone: "primary" },
  { label: "集输管网", value: stats.pipelineKm.toFixed(1), unit: "km", tone: "default" },
]);

const layerItems: { key: LayerKey; label: string; count: string; icon: string }[] = [
  { key: "blocks", label: "区块", count: `${field.blocks.length} 个`, icon: "layers" },
  { key: "wells", label: "井", count: `${field.wells.length} 口`, icon: "well" },
  { key: "stations", label: "站库", count: `${field.stations.length} 座`, icon: "station" },
  { key: "pipelines", label: "管线", count: `${field.pipelines.length} 条`, icon: "pipeline" },
];

const overviewChips = computed(() => [
  { label: "区块", value: field.blocks.length },
  { label: "井", value: field.wells.length },
  { label: "站库", value: field.stations.length },
  { label: "管线", value: field.pipelines.length },
]);

const wellKinds = [
  { key: "oil", label: "油井" },
  { key: "gas", label: "气井" },
  { key: "water", label: "注水井" },
  { key: "observation", label: "观察井" },
];

const mediaKinds = [
  { key: "oil", label: "原油" },
  { key: "gas", label: "天然气" },
  { key: "water", label: "采出水" },
];

const suggestions = computed(() => {
  const warningIds = new Set(
    field.wells.filter((well) => well.status === "warning").map((well) => well.id),
  );
  const warnings = searchItems.filter((item) => warningIds.has(item.id));
  const stations = searchItems.filter((item) => item.kind === "station");
  const pipelines = searchItems.filter((item) => item.kind === "pipeline");
  const merged = [...warnings, ...stations, ...pipelines, ...searchItems];
  const seen = new Set<string>();
  return merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, 6);
});

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return suggestions.value;
  return searchItems
    .filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.sub.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query),
    )
    .slice(0, 8);
});

watch(searchResults, () => {
  searchActive.value = 0;
});

const tooltipStyle = computed(() => {
  if (!hover.value) return {};
  const width = 272;
  const height = 118;
  const x = Math.min(hover.value.x + 18, window.innerWidth - width);
  const y = Math.min(hover.value.y + 18, window.innerHeight - height);
  return {
    left: `${Math.max(12, x)}px`,
    top: `${Math.max(12, y)}px`,
  };
});

function showToast(message: string): void {
  toast.value = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value = "";
  }, 3200);
}

function updateClock(): void {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  clock.time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][now.getDay()];
  clock.date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${week}`;
}

function kindShort(kind: FeatureKind): string {
  if (kind === "well") return "井";
  if (kind === "station") return "站";
  return "管";
}

function toggleLayer(key: LayerKey): void {
  layers[key] = !layers[key];
  hover.value = null;
  scene.setLayerVisibility(key, layers[key]);
}

function toggleLabels(): void {
  labelsOn.value = !labelsOn.value;
  scene.setLabelsVisible(labelsOn.value);
}

function chooseBasemap(key: BasemapKey): void {
  if (key === basemap.key && basemap.status !== "fallback") return;
  hover.value = null;
  basemap.key = key;
  basemap.status = "loading";
  scene.setBasemap(key);
}

function chooseSearch(item: SearchItem): void {
  window.clearTimeout(searchBlurTimer);
  scene.selectFeature(item.id);
  searchOpen.value = false;
  searchQuery.value = "";
  searchInput.value?.blur();
}

function clearSearch(): void {
  searchQuery.value = "";
  searchInput.value?.focus();
  searchOpen.value = true;
}

function onSearchBlur(): void {
  searchBlurTimer = window.setTimeout(() => {
    searchOpen.value = false;
  }, 140);
}

function onSearchKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!searchResults.value.length) return;
    searchOpen.value = true;
    searchActive.value = Math.min(searchActive.value + 1, searchResults.value.length - 1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!searchResults.value.length) return;
    searchActive.value = Math.max(0, searchActive.value - 1);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const item = searchResults.value[searchActive.value];
    if (item) chooseSearch(item);
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    searchOpen.value = false;
    searchInput.value?.blur();
  }
}

function closeDetail(): void {
  scene.clearSelection();
}

function locateSelected(): void {
  if (selectedId.value) scene.flyToFeature(selectedId.value);
}

function openProfile(): void {
  if (selectedId.value) profileId.value = selectedId.value;
}

function closeProfile(): void {
  profileId.value = null;
}

function handleBlockFocus(id: string): void {
  scene.focusBlock(id);
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
  const typing =
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable);

  if (event.key === "Escape") {
    if (typing) return;
    if (profileId.value) {
      closeProfile();
      return;
    }
    if (searchOpen.value) {
      searchOpen.value = false;
      searchInput.value?.blur();
      return;
    }
    if (selectedId.value) {
      closeDetail();
    }
    return;
  }

  if (typing) return;

  if (event.key === "/") {
    event.preventDefault();
    searchInput.value?.focus();
    searchOpen.value = true;
    return;
  }

  if (event.key.toLowerCase() === "l") {
    toggleLabels();
    return;
  }

  if (event.key.toLowerCase() === "f") {
    void toggleFullscreen();
  }
}

onMounted(() => {
  updateClock();
  clockTimer = window.setInterval(updateClock, 1000);
  window.addEventListener("keydown", onKeydown);

  if (!mapEl.value) return;
  try {
    scene.init(mapEl.value);
  } catch (error) {
    console.error("[Leaflet GIS] init failed", error);
    ready.value = true;
    showToast("地图初始化失败，请刷新页面重试");
  }
});

onBeforeUnmount(() => {
  window.clearInterval(clockTimer);
  window.clearTimeout(toastTimer);
  window.clearTimeout(searchBlurTimer);
  window.removeEventListener("keydown", onKeydown);
  scene.destroy();
});
</script>

<template>
  <div
    class="lgis-page"
    :class="{ 'is-ready': ready }"
    :style="tokenVars"
  >
    <div ref="mapEl" class="lgis-map" aria-label="极光油田二维 GIS 地图"></div>
    <div class="lgis-veil" aria-hidden="true"></div>

    <div class="lgis-hud">
      <header class="lgis-header">
        <div class="lgis-brand">
          <div class="lgis-brand__mark" aria-hidden="true">
            <span class="lgis-brand__orbit"></span>
            <span class="lgis-brand__orbit lgis-brand__orbit--two"></span>
            <i></i>
          </div>
          <div class="lgis-brand__copy">
            <strong>AURORA FIELD</strong>
            <div>极光油田 <em>·</em> 二维 GIS</div>
            <small>2D GEOSPATIAL / PRODUCTION COMMAND</small>
          </div>
        </div>

        <div class="lgis-kpis">
          <div v-for="kpi in kpis" :key="kpi.label" class="lgis-kpi" :class="`is-${kpi.tone}`">
            <span>{{ kpi.label }}</span>
            <strong>{{ kpi.value }}<em>{{ kpi.unit }}</em></strong>
          </div>
        </div>

        <div class="lgis-header__right">
          <div class="lgis-clock">
            <strong>{{ clock.time }}</strong>
            <span>{{ clock.date }}</span>
          </div>
          <div class="lgis-sync">
            <span class="lgis-led" :class="{ 'is-warn': basemap.status === 'fallback' }"></span>
            <div>
              <b>{{ statusText }}</b>
              <small>{{ basemapMeta.en }} · {{ crsLabel }}</small>
            </div>
          </div>
          <button class="lgis-icon-btn" type="button" title="全屏" @click="toggleFullscreen">
            <AfIcon name="fullscreen" :size="16" />
          </button>
        </div>
      </header>

      <aside class="lgis-left">
        <div class="lgis-search">
          <div class="lgis-search__box" :class="{ 'is-open': searchOpen }">
            <AfIcon name="search" :size="14" />
            <input
              id="lgis-search"
              name="lgis-search"
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="搜索井 / 站库 / 管线"
              aria-label="搜索井、站库、管线"
              @focus="searchOpen = true"
              @blur="onSearchBlur"
              @keydown="onSearchKeydown"
            />
            <button
              v-if="searchQuery"
              class="lgis-search__clear"
              type="button"
              title="清空搜索"
              @click="clearSearch"
            >
              <AfIcon name="close" :size="11" />
            </button>
            <kbd v-else>/</kbd>
          </div>
          <transition name="lgis-drop">
            <div v-if="searchOpen" class="lgis-search__results">
              <div class="lgis-search__hint">
                {{ searchQuery.trim() ? `匹配 ${searchResults.length} 项` : "预警井 · 站库 · 管线" }}
              </div>
              <button
                v-for="(item, index) in searchResults"
                :key="item.id"
                type="button"
                class="lgis-search__item"
                :class="{ 'is-active': index === searchActive }"
                @mouseenter="searchActive = index"
                @mousedown.prevent="chooseSearch(item)"
              >
                <span class="lgis-search__kind" :class="`is-${item.kind}`">
                  {{ kindShort(item.kind) }}
                </span>
                <span class="lgis-search__copy">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.sub }}</small>
                </span>
                <em>{{ item.id }}</em>
              </button>
              <div v-if="!searchResults.length" class="lgis-search__empty">未找到匹配对象</div>
            </div>
          </transition>
        </div>

        <section class="lgis-panel lgis-layers">
          <div class="lgis-panel__head">
            <div class="lgis-panel__title">
              <span class="lgis-panel__bar"></span>
              图层
              <small>LAYERS {{ activeLayerCount }}/4</small>
            </div>
            <button class="lgis-panel__action" type="button" title="重置视野" @click="scene.resetView()">
              <AfIcon name="reset" :size="12" />
            </button>
          </div>
          <div class="lgis-panel__body">
            <button
              v-for="item in layerItems"
              :key="item.key"
              class="lgis-layer"
              :class="{ 'is-on': layers[item.key] }"
              type="button"
              :aria-pressed="layers[item.key]"
              @click="toggleLayer(item.key)"
            >
              <span class="lgis-layer__check">
                <AfIcon v-if="layers[item.key]" name="check" :size="10" />
              </span>
              <span class="lgis-layer__icon" :class="`is-${item.key}`">
                <AfIcon :name="item.icon" :size="14" />
              </span>
              <span class="lgis-layer__copy">
                <strong>{{ item.label }}</strong>
                <small>{{ item.count }}</small>
              </span>
              <i class="lgis-layer__toggle"></i>
            </button>
            <button
              class="lgis-layer"
              :class="{ 'is-on': labelsOn }"
              type="button"
              :aria-pressed="labelsOn"
              @click="toggleLabels"
            >
              <span class="lgis-layer__check">
                <AfIcon v-if="labelsOn" name="check" :size="10" />
              </span>
              <span class="lgis-layer__icon is-labels">
                <AfIcon name="labels" :size="14" />
              </span>
              <span class="lgis-layer__copy">
                <strong>标签</strong>
                <small>按缩放分级</small>
              </span>
              <i class="lgis-layer__toggle"></i>
            </button>
          </div>
        </section>

        <section class="lgis-panel lgis-legend">
          <div class="lgis-panel__head">
            <div class="lgis-panel__title">
              <span class="lgis-panel__bar"></span>
              图例
              <small>LEGEND</small>
            </div>
          </div>
          <div class="lgis-panel__body">
            <div class="lgis-legend__group">
              <span class="lgis-legend__label">井 / WELL</span>
              <div class="lgis-legend__row">
                <span v-for="kind in wellKinds" :key="kind.key" class="lgis-legend__item">
                  <i class="lgis-dot" :class="`is-${kind.key}`"></i>{{ kind.label }}
                </span>
              </div>
            </div>
            <div class="lgis-legend__group">
              <span class="lgis-legend__label">管线 / PIPE</span>
              <div class="lgis-legend__row">
                <span v-for="medium in mediaKinds" :key="medium.key" class="lgis-legend__item">
                  <i class="lgis-line" :class="`is-${medium.key}`"></i>{{ medium.label }}
                </span>
              </div>
            </div>
            <div class="lgis-legend__group">
              <span class="lgis-legend__label">状态 / STATUS</span>
              <div class="lgis-legend__row">
                <span class="lgis-legend__item"><i class="lgis-dot is-warning"></i>参数预警</span>
                <span class="lgis-legend__item"><i class="lgis-dot is-offline"></i>停产</span>
              </div>
            </div>
          </div>
        </section>
      </aside>

      <aside class="lgis-right">
        <WellSection
          v-if="profileWell && profileDetail"
          :well="profileWell"
          :detail="profileDetail"
          :strata="field.strata"
          :reservoirs="field.reservoirs"
          @close="closeProfile"
          @locate="locateSelected"
        />
        <DetailPanel
          v-else-if="selectedDetail"
          :detail="selectedDetail"
          @close="closeDetail"
          @locate="locateSelected"
          @profile="openProfile"
        />
        <section v-else class="lgis-panel lgis-overview">
          <div class="lgis-panel__head">
            <div class="lgis-panel__title">
              <span class="lgis-panel__bar"></span>
              油田概览
              <small>FIELD OVERVIEW</small>
            </div>
          </div>
          <div class="lgis-panel__body">
            <div class="lgis-overview__chips">
              <span v-for="chip in overviewChips" :key="chip.label">
                <b>{{ chip.value }}</b>{{ chip.label }}
              </span>
            </div>
            <div class="lgis-overview__title">
              区块产量
              <small>BLOCK OUTPUT · t/d</small>
            </div>
            <button
              v-for="block in stats.blockRanking"
              :key="block.id"
              class="lgis-rank"
              type="button"
              :title="`定位 ${block.name}`"
              @click="handleBlockFocus(block.id)"
            >
              <span class="lgis-rank__name">{{ block.name }}</span>
              <span class="lgis-rank__bar">
                <i :class="`is-${block.colorKey}`" :style="{ width: `${block.percent}%` }"></i>
              </span>
              <strong>{{ block.oil.toFixed(0) }}</strong>
            </button>
            <div class="lgis-overview__note">
              <AfIcon name="info" :size="12" />
              固定种子演示数据 · 双击井位进入井轨迹
            </div>
            <div class="lgis-overview__hint">单击井 / 站库 / 管线查看详情，Esc 返回全景</div>
          </div>
        </section>
      </aside>

      <div class="lgis-basemap-dock">
        <div class="lgis-basemap-dock__head">
          <span>底图 / BASEMAP</span>
          <em :class="`is-${basemap.status}`"><i></i>{{ statusText }} · {{ crsLabel }}</em>
        </div>
        <div class="lgis-basemap-dock__grid">
          <button
            v-for="def in BASEMAPS"
            :key="def.key"
            type="button"
            class="lgis-base"
            :class="[`is-${def.key}`, { 'is-active': basemap.key === def.key }]"
            :aria-pressed="basemap.key === def.key"
            :title="def.credit"
            @click="chooseBasemap(def.key)"
          >
            <span class="lgis-base__preview"><i></i></span>
            <span class="lgis-base__copy">
              <strong>{{ def.label }}</strong>
              <small>{{ def.en }}</small>
            </span>
          </button>
        </div>
        <div class="lgis-basemap-dock__foot">
          <span>{{ creditText }}</span>
          <span>{{ zoomText }} Z</span>
        </div>
      </div>

      <div class="lgis-zoom">
        <button type="button" title="放大" @click="scene.zoomIn()">+</button>
        <button type="button" title="缩小" @click="scene.zoomOut()">−</button>
        <button type="button" title="重置视野" @click="scene.resetView()">
          <AfIcon name="reset" :size="14" />
        </button>
      </div>

      <footer class="lgis-status">
        <div class="lgis-status__left">
          <span class="lgis-led" :class="{ 'is-warn': basemap.status === 'fallback' }"></span>
          <span>{{ pointerText }}</span>
          <i></i>
          <span>极光油田 · 演示数据</span>
        </div>
        <div class="lgis-status__center">AURORA FIELD / 2D GEOSPATIAL</div>
        <div class="lgis-status__right">
          <span>缩放 {{ zoomText }}</span>
          <i></i>
          <span>标签 {{ labelsOn ? "开" : "关" }}</span>
          <i></i>
          <span>底图 {{ basemapMeta.label }} · {{ statusText }}</span>
          <i></i>
          <span>{{ creditText }}</span>
        </div>
      </footer>

      <transition name="lgis-tooltip">
        <div v-if="hover" class="lgis-tooltip" :style="tooltipStyle">
          <span class="lgis-tooltip__kind">{{ hover.kindLabel }}</span>
          <strong>{{ hover.name }}</strong>
          <p>{{ hover.meta }}</p>
          <small>{{ hover.hint }}</small>
        </div>
      </transition>

      <transition name="lgis-fade">
        <div v-if="toast" class="lgis-toast">{{ toast }}</div>
      </transition>
    </div>
  </div>
</template>

<style lang="scss">
@use "./leaflet.scss";
</style>
