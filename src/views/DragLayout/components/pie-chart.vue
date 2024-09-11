<template>
  <div :class="`pie-chart${props.index}`"></div>
</template>

<script lang="ts">
export default { name: "PieChart" };
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
  title: {
    text: "Referer of a Website",
    subtext: "Fake Data",
    left: "center",
  },
  tooltip: {
    trigger: "item",
  },
  legend: {
    orient: "vertical",
    left: "left",
  },
  series: [
    {
      name: "Access From",
      type: "pie",
      radius: "50%",
      data: [
        { value: 1048, name: "Search Engine" },
        { value: 735, name: "Direct" },
        { value: 580, name: "Email" },
        { value: 484, name: "Union Ads" },
        { value: 300, name: "Video Ads" },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
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
      `.pie-chart${props.index}`
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
.pie-chart {
  width: 100%;
  height: 100%;
}
</style>
