<script lang="ts" setup>
import { computed } from "vue";
import AfIcon from "./AfIcon.vue";
import AfPanel from "./AfPanel.vue";
import type { LayerKey } from "../data/types";
import { actions, state } from "./store";

interface LayerRow {
  key: LayerKey;
  label: string;
  icon: string;
  count: string;
  tone: string;
}

const rows = computed<LayerRow[]>(() => [
  {
    key: "wells",
    label: "井场",
    icon: "well",
    count: `${state.stats.totalWells}`,
    tone: "gas",
  },
  {
    key: "stations",
    label: "平台 / 站库",
    icon: "station",
    count: `${state.stats.platformCount ?? 0} / ${state.stats.stationCount ?? 0}`,
    tone: "primary",
  },
  {
    key: "pipelines",
    label: "集输管网",
    icon: "pipeline",
    count: `${state.stats.pipelineCount ?? 0}`,
    tone: "gas",
  },
  {
    key: "blocks",
    label: "区块边界",
    icon: "layers",
    count: `${state.stats.blockRanking.length}`,
    tone: "sulfur",
  },
  {
    key: "labels",
    label: "场景标签",
    icon: "labels",
    count: "自动",
    tone: "info",
  },
]);

const activeCount = computed(
  () => rows.value.filter((row) => state.layers[row.key]).length,
);

function toggle(key: LayerKey): void {
  actions.toggleLayer(key);
}
</script>

<template>
  <AfPanel title="图层控制">
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
      <span><i class="is-gas"></i>天然气</span>
      <span><i class="is-water"></i>采出水</span>
      <span><i class="is-oil"></i>硫磺</span>
      <span><i class="is-danger"></i>告警</span>
    </div>
  </AfPanel>
</template>
