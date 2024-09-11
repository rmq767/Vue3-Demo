<template>
  <div :class="`bar-chart${props.index}`"></div>
</template>

<script lang="ts">
export default { name: "BarChart" };
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
      data: [120, 200, 150, 80, 70, 110, 130],
      type: "bar",
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
      `.bar-chart${props.index}`
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
.bar-chart {
  width: 100%;
  height: 100%;
}
</style>
