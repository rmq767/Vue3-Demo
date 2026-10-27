<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import AfPanel from "./AfPanel.vue";
import { TOKENS } from "../styles/tokens";
import { state } from "./store";

const chartEl = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

const timeLabels = Array.from({ length: 24 }, (_, index) =>
  `${String(index).padStart(2, "0")}:00`,
);

const ranking = computed(() => state.stats.blockRanking);

function buildOption(): echarts.EChartsOption {
  const oil = state.stats.history.oil;
  const gas = state.stats.history.gas;
  const oilMax = Math.max(...oil, 1) * 1.22;
  const gasMax = Math.max(...gas, 1) * 1.22;

  return {
    animationDuration: 650,
    animationEasing: "cubicOut",
    grid: { left: 4, right: 4, top: 12, bottom: 18 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(3,15,25,.96)",
      borderColor: "rgba(61,225,255,.4)",
      borderWidth: 1,
      textStyle: {
        color: TOKENS.colors.ink,
        fontSize: 11,
        fontFamily: TOKENS.fonts.body,
      },
      axisPointer: {
        type: "line",
        lineStyle: { color: "rgba(61,225,255,.3)", width: 1 },
      },
    },
    xAxis: {
      type: "category",
      data: timeLabels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "rgba(61,225,255,.14)" } },
      axisTick: { show: false },
      axisLabel: {
        color: TOKENS.colors.inkMuted,
        fontSize: 9,
        interval: 5,
        fontFamily: TOKENS.fonts.number,
      },
    },
    yAxis: [
      {
        type: "value",
        show: false,
        min: 0,
        max: oilMax,
      },
      {
        type: "value",
        show: false,
        min: 0,
        max: gasMax,
      },
    ],
    series: [
      {
        name: "原油 t/d",
        type: "line",
        data: oil,
        smooth: 0.38,
        symbol: "none",
        lineStyle: { width: 1.8, color: TOKENS.colors.oil },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(245,165,36,.26)" },
            { offset: 1, color: "rgba(245,165,36,0)" },
          ]),
        },
      },
      {
        name: "天然气 万m³/d",
        type: "line",
        yAxisIndex: 1,
        data: gas,
        smooth: 0.38,
        symbol: "none",
        lineStyle: {
          width: 1.2,
          color: TOKENS.colors.gas,
          type: "dashed",
          opacity: 0.72,
        },
      },
    ],
  };
}

function updateChart(): void {
  chart?.setOption(buildOption(), { notMerge: true });
}

onMounted(() => {
  if (!chartEl.value) return;
  chart = echarts.init(chartEl.value, undefined, { renderer: "canvas" });
  updateChart();
});

watch(
  () => state.stats,
  () => updateChart(),
);

onBeforeUnmount(() => {
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <AfPanel title="生产态势" subtitle="24H">
    <template #extra>
      <span class="af-live-tag"><i></i> LIVE · 3S</span>
    </template>

    <div class="af-prod">
      <div class="af-prod__legend">
        <span><i class="is-oil"></i>原油产量</span>
        <span><i class="is-gas"></i>天然气</span>
        <em>t/d · 万m³/d</em>
      </div>
      <div ref="chartEl" class="af-prod__chart"></div>

      <div class="af-ranking">
        <div class="af-ranking__head">
          <span>区块产量</span>
          <em>t/d</em>
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
          <strong>{{ block.oil.toFixed(0) }}</strong>
        </div>
        <div v-if="!ranking.length" class="af-empty">等待生产数据</div>
      </div>
    </div>
  </AfPanel>
</template>
