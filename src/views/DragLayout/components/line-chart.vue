<template>
  <div :class="`line-chart${props.index}`"></div>
</template>

<script lang="ts">
export default { name: "LineChart" };
</script>
<script lang="ts" setup>
import * as echarts from "echarts";
import { nextTick, onMounted } from "vue";

const props = defineProps({
  index: {
    type: [String, Number],
    default: 0,
  },
});

let chart: echarts.ECharts;
const option = {
  xAxis: {
    type: "category",
    data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      data: [150, 230, 224, 218, 135, 147, 260],
      type: "line",
    },
  ],
};

const setOption = (el: echarts.ECharts) => {
  el.setOption(option);
  el.resize();
};

const resize = () => {
  chart.resize();
};

onMounted(() => {
  nextTick(() => {
    const el = document.querySelector(
      `.line-chart${props.index}`
    ) as HTMLElement;
    chart = echarts.init(el);
    setOption(chart);
  });
});

defineExpose({
  resize,
});
</script>

<style lang="scss" scoped>
.line-chart {
  width: 100%;
  height: 100%;
}
</style>
