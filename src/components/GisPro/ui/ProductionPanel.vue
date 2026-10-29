<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import AfPanel from "./AfPanel.vue";
import { TOKENS, getTheme, type ThemeDefinition } from "../styles/tokens";
import { state } from "./store";

const chartEl = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

const timeLabels = Array.from({ length: 24 }, (_, index) =>
  `${String(index).padStart(2, "0")}:00`,
);

const ranking = computed(() => state.stats.blockRanking);

function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith("#") || color.length !== 7) return color;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildOption(theme: ThemeDefinition): echarts.EChartsOption {
  const gas = state.stats.history.gas;
  const sweetGas = state.stats.history.sweetGas ?? gas.map((value) => value * 0.884);
  const gasMax = Math.max(...gas, ...sweetGas, 1) * 1.16;
  const colors = theme.colors;

  return {
    animationDuration: 500,
    animationEasing: "cubicOut",
    grid: { left: 4, right: 4, top: 12, bottom: 18 },
    tooltip: {
      trigger: "axis",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: {
        color: colors.text,
        fontSize: 11,
        fontFamily: TOKENS.fonts.body,
      },
      axisPointer: {
        type: "line",
        lineStyle: { color: colors.borderStrong, width: 1 },
      },
    },
    xAxis: {
      type: "category",
      data: timeLabels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: colors.border } },
      axisTick: { show: false },
      axisLabel: {
        color: colors.textMuted,
        fontSize: 9,
        interval: 5,
        fontFamily: TOKENS.fonts.number,
      },
    },
    yAxis: {
      type: "value",
      show: false,
      min: 0,
      max: gasMax,
    },
    series: [
      {
        name: "原料气 万m³/d",
        type: "line",
        data: gas,
        smooth: 0.32,
        symbol: "none",
        lineStyle: { width: 1.8, color: colors.gas },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: withAlpha(colors.gas, 0.2) },
            { offset: 1, color: withAlpha(colors.gas, 0) },
          ]),
        },
      },
      {
        name: "净化气 万m³/d",
        type: "line",
        data: sweetGas,
        smooth: 0.32,
        symbol: "none",
        lineStyle: {
          width: 1.2,
          color: colors.primary,
          type: "dashed",
          opacity: 0.82,
        },
      },
    ],
  };
}

function updateChart(): void {
  chart?.setOption(buildOption(getTheme(state.theme)), { notMerge: true });
}

onMounted(() => {
  if (!chartEl.value) return;
  chart = echarts.init(chartEl.value, undefined, { renderer: "canvas" });
  updateChart();
});

watch(
  [() => state.stats, () => state.theme],
  () => updateChart(),
);

onBeforeUnmount(() => {
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <AfPanel title="生产态势" subtitle="近24小时">
    <div class="af-prod">
      <div class="af-prod__legend">
        <span><i class="is-gas"></i>原料气</span>
        <span><i class="is-primary"></i>净化气</span>
        <em>万m³/d</em>
      </div>
      <div ref="chartEl" class="af-prod__chart"></div>

      <div class="af-ranking">
        <div class="af-ranking__head">
          <span>区块日产气</span>
          <em>万m³/d</em>
        </div>
        <div
          v-for="block in ranking"
          :key="block.id"
          class="af-ranking__row"
        >
          <span class="af-ranking__name">{{ block.name }}</span>
          <div class="af-ranking__track">
            <i
              :style="{
                width: `${block.percent}%`,
                background: `var(--af-${block.colorKey === 'warning' ? 'oil' : block.colorKey})`,
              }"
            ></i>
          </div>
          <strong>{{ (block.gas ?? 0).toFixed(1) }}</strong>
        </div>
        <div v-if="!ranking.length" class="af-empty">等待生产数据</div>
      </div>
    </div>
  </AfPanel>
</template>
