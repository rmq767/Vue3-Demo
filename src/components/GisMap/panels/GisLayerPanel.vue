<script lang="ts">
export default { name: "GisLayerPanel" };
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { FieldEvent, Kind, LayerItem, SearchItem } from "../data/types";

const props = defineProps<{
  layers: LayerItem[];
  labelsVisible: boolean;
  index: SearchItem[];
  events: FieldEvent[];
}>();

const emit = defineEmits<{
  (event: "toggle-layer", key: LayerItem["key"], visible: boolean): void;
  (event: "toggle-labels", visible: boolean): void;
  (event: "select", id: string): void;
}>();

const query = ref("");
const open = ref(false);
const activeIndex = ref(0);
let blurTimer: number | undefined;

const results = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) return [];
  return props.index
    .filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.sub.toLowerCase().includes(keyword),
    )
    .slice(0, 9);
});

watch(results, () => {
  activeIndex.value = 0;
});

watch(query, (value) => {
  if (value.trim()) open.value = true;
});

const visibleCount = computed(() => props.layers.filter((layer) => layer.visible).length);

function kindLabel(kind: Kind): string {
  if (kind === "block") return "区块";
  if (kind === "well") return "井";
  if (kind === "platform") return "平台";
  return "管道";
}

function choose(item: SearchItem) {
  emit("select", item.id);
  query.value = "";
  open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    open.value = false;
    return;
  }
  if (!results.value.length) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % results.value.length;
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length;
  } else if (event.key === "Enter") {
    event.preventDefault();
    const item = results.value[activeIndex.value];
    if (item) choose(item);
  }
}

function onBlur() {
  window.clearTimeout(blurTimer);
  blurTimer = window.setTimeout(() => {
    open.value = false;
  }, 140);
}

function onFocus() {
  window.clearTimeout(blurTimer);
  open.value = true;
}

function timeOf(ts: number): string {
  const date = new Date(ts);
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

onBeforeUnmount(() => window.clearTimeout(blurTimer));
</script>

<template>
  <div class="gis-left-stack">
    <div class="gis-panel gis-search-panel">
      <div class="gis-search">
        <svg class="gis-search-icon" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="9" cy="9" r="5.6"></circle>
          <path d="M13.2 13.2 17 17"></path>
        </svg>
        <input
          v-model="query"
          class="gis-search-input"
          type="text"
          placeholder="搜索井 / 区块 / 平台 / 管道"
          @click="open = !!query"
          @focus="onFocus"
          @blur="onBlur"
          @keydown="onKeydown"
        />
        <button v-if="query" class="gis-search-clear" type="button" @click="query = ''">
          ×
        </button>
        <transition name="gis-fade">
          <div v-if="open && query" class="gis-search-results">
            <button
              v-for="(item, index) in results"
              :key="item.id"
              type="button"
              class="gis-search-item"
              :class="{ 'is-active': index === activeIndex }"
              @mousedown.prevent="choose(item)"
              @mouseenter="activeIndex = index"
            >
              <span class="gis-search-kind" :class="`is-${item.kind}`">{{ kindLabel(item.kind) }}</span>
              <span class="gis-search-name">{{ item.name }}</span>
              <span class="gis-search-sub">{{ item.sub }}</span>
            </button>
            <div v-if="!results.length" class="gis-search-empty">未找到匹配要素</div>
          </div>
        </transition>
      </div>
    </div>

    <div class="gis-panel gis-layer-panel">
      <div class="gis-panel-head">
        <span class="gis-panel-title">图层控制</span>
        <span class="gis-panel-sub">{{ visibleCount }} / {{ layers.length }} 可见</span>
      </div>
      <div class="gis-layer-list">
        <div
          v-for="layer in layers"
          :key="layer.key"
          class="gis-layer-row"
          :class="{ 'is-off': !layer.visible }"
          @click="emit('toggle-layer', layer.key, !layer.visible)"
        >
          <span class="gis-layer-dot" :style="{ background: layer.color, boxShadow: `0 0 10px ${layer.color}` }"></span>
          <span class="gis-layer-name">{{ layer.label }}</span>
          <span class="gis-layer-count">{{ layer.count }}</span>
          <button
            type="button"
            class="gis-switch"
            :class="{ 'is-on': layer.visible }"
            role="switch"
            :aria-checked="layer.visible"
            :aria-label="`切换${layer.label}图层`"
            @click.stop="emit('toggle-layer', layer.key, !layer.visible)"
          >
            <span></span>
          </button>
        </div>
        <div class="gis-layer-row gis-layer-row-labels">
          <span class="gis-layer-dot is-text"></span>
          <span class="gis-layer-name">名称标签</span>
          <span class="gis-layer-count">TXT</span>
          <button
            type="button"
            class="gis-switch"
            :class="{ 'is-on': labelsVisible }"
            role="switch"
            :aria-checked="labelsVisible"
            aria-label="切换名称标签"
            @click="emit('toggle-labels', !labelsVisible)"
          >
            <span></span>
          </button>
        </div>
      </div>
    </div>

    <div class="gis-panel gis-legend-panel">
      <div class="gis-panel-head">
        <span class="gis-panel-title">图例</span>
        <span class="gis-panel-sub">LEGEND</span>
      </div>
      <div class="gis-legend">
        <div class="gis-legend-group">
          <span class="gis-legend-label">井型</span>
          <span class="gis-legend-item">
            <svg class="gis-legend-icon" viewBox="0 0 16 16"><path d="M8 3v9M5 12h6M5 7l3-3 3 3"></path></svg>
            直井
          </span>
          <span class="gis-legend-item">
            <svg class="gis-legend-icon" viewBox="0 0 16 16"><path d="M4 12 11 4M7 12l7-8"></path></svg>
            定向井
          </span>
          <span class="gis-legend-item">
            <svg class="gis-legend-icon" viewBox="0 0 16 16"><path d="M5 3v6h7M9 6l3 3-3 3"></path></svg>
            水平井
          </span>
        </div>
        <div class="gis-legend-group">
          <span class="gis-legend-label">状态</span>
          <span class="gis-legend-item"><i class="gis-dot is-cyan"></i>正常</span>
          <span class="gis-legend-item"><i class="gis-dot is-amber"></i>预警</span>
          <span class="gis-legend-item"><i class="gis-dot is-grey"></i>停产</span>
        </div>
        <div class="gis-legend-group">
          <span class="gis-legend-label">管道</span>
          <span class="gis-legend-item"><i class="gis-line is-cyan"></i>运行</span>
          <span class="gis-legend-item"><i class="gis-line is-amber"></i>检修</span>
          <span class="gis-legend-item"><i class="gis-line is-grey"></i>停输</span>
        </div>
      </div>
    </div>

    <div class="gis-panel gis-event-panel">
      <div class="gis-panel-head">
        <span class="gis-panel-title">实时动态</span>
        <span class="gis-panel-sub is-live">LIVE</span>
      </div>
      <transition-group tag="ul" name="gis-event" class="gis-event-list">
        <li v-for="event in events.slice(0, 3)" :key="event.id" :class="`is-${event.level}`">
          <time>{{ timeOf(event.ts) }}</time>
          <span>{{ event.sourceName }} · {{ event.message }}</span>
        </li>
        <li v-if="!events.length" key="empty" class="is-empty">等待实时数据…</li>
      </transition-group>
    </div>
  </div>
</template>
