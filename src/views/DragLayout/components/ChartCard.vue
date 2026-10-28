<template>
  <section
    class="chart-card"
    :class="{ 'is-selected': selected }"
    @click="emit('select')"
  >
    <header class="card-head">
      <span class="card-title">{{ title || "未命名" }}</span>
      <button
        class="card-remove"
        type="button"
        aria-label="删除卡片"
        @click.stop="emit('remove')"
      >
        ×
      </button>
    </header>
    <div ref="chartEl" class="chart-body"></div>
  </section>
</template>

<script lang="ts">
export default { name: "ChartCard" };
</script>
<script lang="ts" setup>
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ChartType } from "../types";

const props = withDefaults(
  defineProps<{
    title: string;
    chartType: ChartType;
    theme: string;
    selected?: boolean;
  }>(),
  { selected: false },
);

const emit = defineEmits<{
  (e: "select"): void;
  (e: "remove"): void;
}>();

const chartEl = ref<HTMLDivElement>();

let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let resizeFrame = 0;

function buildOption(): EChartsOption {
  if (props.chartType === "pie") {
    return {
      color: [props.theme, "#91cc75", "#fac858", "#ee6666"],
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["42%", "70%"],
          label: { show: false },
          data: [
            { value: 1048, name: "搜索引擎" },
            { value: 735, name: "直接访问" },
            { value: 580, name: "邮件营销" },
            { value: 484, name: "联盟广告" },
          ],
        },
      ],
    };
  }

  const data = [150, 230, 224, 218, 135, 147, 260];

  return {
    color: [props.theme],
    tooltip: { trigger: "axis" },
    grid: { left: 12, right: 16, top: 20, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: props.chartType === "bar",
      data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    },
    yAxis: { type: "value" },
    series:
      props.chartType === "line"
        ? [{ type: "line" as const, smooth: true, data }]
        : [{ type: "bar" as const, barMaxWidth: 24, data }],
  };
}

function render() {
  chart?.setOption(buildOption(), { notMerge: true });
}

onMounted(() => {
  if (!chartEl.value) return;
  chart = echarts.init(chartEl.value);
  render();

  resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => chart?.resize());
  });
  resizeObserver.observe(chartEl.value);
});

watch(
  () => [props.chartType, props.theme],
  () => render(),
);

onBeforeUnmount(() => {
  cancelAnimationFrame(resizeFrame);
  resizeObserver?.disconnect();
  resizeObserver = null;
  chart?.dispose();
  chart = null;
});
</script>

<style lang="scss" scoped>
.chart-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #fff;
  border-radius: 4px;

  &.is-selected {
    outline: 2px solid #409eff;
    outline-offset: -2px;
  }
}

.card-head {
  display: flex;
  flex: 0 0 34px;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 4px 0 10px;
  cursor: move;
  border-bottom: 1px solid #eee;
}

.card-title {
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-remove {
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  color: #999;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;

  &:hover {
    color: #f56c6c;
    background-color: #f5f5f5;
  }
}

.chart-body {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
