<script lang="ts" setup>
import { computed } from "vue";
import AfIcon from "./AfIcon.vue";
import AfPanel from "./AfPanel.vue";
import type { LayerKey } from "../data/types";
import { actions, state } from "./store";

interface LayerRow {
  key: LayerKey;
  label: string;
  sub: string;
  icon: string;
  count: string;
  tone: string;
}

const rows: LayerRow[] = [
  { key: "wells", label: "井场", sub: "WELL PAD", icon: "well", count: "42", tone: "oil" },
  { key: "stations", label: "站库", sub: "STATION", icon: "station", count: "08", tone: "primary" },
  { key: "pipelines", label: "集输管网", sub: "PIPELINE", icon: "pipeline", count: "12", tone: "gas" },
  { key: "blocks", label: "区块边界", sub: "BLOCKS", icon: "layers", count: "05", tone: "success" },
  { key: "arcs", label: "数据流弧", sub: "DATA ARC", icon: "spark", count: "09", tone: "violet" },
  { key: "labels", label: "场景标签", sub: "LABELS", icon: "labels", count: "AUTO", tone: "info" },
];

const activeCount = computed(
  () => Object.values(state.layers).filter(Boolean).length,
);

function toggle(key: LayerKey): void {
  actions.toggleLayer(key);
}
</script>

<template>
  <AfPanel title="图层控制" subtitle="LAYERS">
    <template #extra>
      <span class="af-mini-tag">{{ activeCount }} / {{ rows.length }}</span>
      <button
        class="af-icon-btn af-icon-btn--small"
        type="button"
        title="重置视角"
        @click="actions.resetView()"
      >
        <AfIcon name="reset" :size="14" />
      </button>
    </template>

    <div class="af-layers">
      <div v-for="row in rows" :key="row.key" class="af-layer">
        <span class="af-layer__icon" :style="{ color: `var(--af-${row.tone})` }">
          <AfIcon :name="row.icon" :size="15" />
        </span>
        <div class="af-layer__copy">
          <strong>{{ row.label }}</strong>
          <small>{{ row.sub }}</small>
        </div>
        <em>{{ row.count }}</em>
        <button
          class="af-switch"
          :class="{ 'is-on': state.layers[row.key] }"
          type="button"
          role="switch"
          :aria-checked="state.layers[row.key]"
          :aria-label="`切换${row.label}`"
          @click="toggle(row.key)"
        >
          <span></span>
        </button>
      </div>
    </div>

    <div class="af-legend">
      <span><i class="is-oil"></i>原油</span>
      <span><i class="is-gas"></i>天然气</span>
      <span><i class="is-water"></i>采出水</span>
      <span><i class="is-danger"></i>告警</span>
    </div>
  </AfPanel>
</template>
