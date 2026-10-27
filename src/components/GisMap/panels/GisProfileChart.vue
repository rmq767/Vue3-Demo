<script lang="ts">
export default { name: "GisProfileChart" };
</script>

<script lang="ts" setup>
import { computed } from "vue";
import type { TrajectoryPoint } from "../data/types";

const props = defineProps<{
  trajectory?: TrajectoryPoint[];
  history: number[];
}>();

const chart = computed(() => {
  const points = props.trajectory ?? [];
  if (points.length < 2) return null;
  const width = 300;
  const height = 118;
  const pad = { left: 34, right: 12, top: 12, bottom: 20 };
  const maxHd = Math.max(...points.map((point) => point.hd), 100);
  const maxTvd = Math.max(...points.map((point) => point.tvd), 100);
  const x = (hd: number) => pad.left + (hd / maxHd) * (width - pad.left - pad.right);
  const y = (tvd: number) => pad.top + (tvd / maxTvd) * (height - pad.top - pad.bottom);
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.hd).toFixed(1)} ${y(point.tvd).toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  const grid = [0.33, 0.66].map((ratio) => ({
    y: pad.top + ratio * (height - pad.top - pad.bottom),
    label: Math.round(maxTvd * ratio),
  }));
  return {
    width,
    height,
    path,
    startX: x(0),
    startY: y(0),
    endX: x(last.hd),
    endY: y(last.tvd),
    maxTvd: Math.round(maxTvd),
    maxHd: Math.round(maxHd),
    grid,
  };
});

const spark = computed(() => {
  const values = props.history.slice(-30);
  if (values.length < 2) return null;
  const width = 300;
  const height = 54;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const x = (index: number) => pad + (index / (values.length - 1)) * (width - pad * 2);
  const y = (value: number) => pad + (1 - (value - min) / span) * (height - pad * 2);
  const path = values
    .map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(value).toFixed(1)}`)
    .join(" ");
  const area = `${path} L${x(values.length - 1).toFixed(1)} ${height - pad} L${x(0).toFixed(1)} ${height - pad} Z`;
  return {
    width,
    height,
    path,
    area,
    lastX: x(values.length - 1),
    lastY: y(values[values.length - 1]),
    min: min.toFixed(1),
    max: max.toFixed(1),
  };
});
</script>

<template>
  <div class="gis-profile">
    <div class="gis-profile-head">
      <span>井眼轨迹剖面</span>
      <small>TVD / 水平位移</small>
    </div>
    <svg
      v-if="chart"
      class="gis-profile-svg"
      :viewBox="`0 0 ${chart.width} ${chart.height}`"
      role="img"
      aria-label="井眼轨迹剖面"
    >
      <g class="gis-profile-grid">
        <line :x1="chart.startX" :y1="chart.startY" :x2="chart.width - 12" :y2="chart.startY"></line>
        <line
          v-for="line in chart.grid"
          :key="line.label"
          :x1="chart.startX"
          :y1="line.y"
          :x2="chart.width - 12"
          :y2="line.y"
        ></line>
      </g>
      <path class="gis-profile-path" :d="chart.path"></path>
      <circle class="gis-profile-dot" :cx="chart.startX" :cy="chart.startY" r="2.6"></circle>
      <circle class="gis-profile-dot is-end" :cx="chart.endX" :cy="chart.endY" r="3.2"></circle>
      <text class="gis-profile-text" :x="4" :y="chart.startY + 3">0</text>
      <text class="gis-profile-text" :x="4" :y="chart.height - 22">{{ chart.maxTvd }}m</text>
      <text class="gis-profile-text" :x="chart.width - 12" :y="chart.height - 6" text-anchor="end">
        水平位移 {{ chart.maxHd }}m
      </text>
    </svg>
    <div v-else class="gis-profile-empty">直井暂无测斜轨迹</div>

    <div class="gis-profile-head is-spark">
      <span>近期产气趋势</span>
      <small>近 30 次采样</small>
    </div>
    <svg
      v-if="spark"
      class="gis-profile-svg is-spark"
      :viewBox="`0 0 ${spark.width} ${spark.height}`"
      role="img"
      aria-label="近期产气趋势"
    >
      <path class="gis-spark-area" :d="spark.area"></path>
      <path class="gis-spark-line" :d="spark.path"></path>
      <circle class="gis-spark-dot" :cx="spark.lastX" :cy="spark.lastY" r="2.4"></circle>
      <text class="gis-profile-text" x="6" :y="12">{{ spark.max }}</text>
      <text class="gis-profile-text" x="6" :y="spark.height - 6">{{ spark.min }}</text>
    </svg>
    <div v-else class="gis-profile-empty">暂无产气数据</div>
  </div>
</template>
