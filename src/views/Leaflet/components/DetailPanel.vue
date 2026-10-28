<script lang="ts" setup>
import { computed } from "vue";
import type { FeatureDetail } from "@/components/GisPro/data/types";
import AfIcon from "@/components/GisPro/ui/AfIcon.vue";

const props = defineProps<{ detail: FeatureDetail }>();
const emit = defineEmits<{ close: []; locate: []; profile: [] }>();

const iconName = computed(() =>
  props.detail.kind === "well"
    ? "well"
    : props.detail.kind === "station"
      ? "station"
      : "pipeline",
);

const kindLabel = computed(() =>
  props.detail.kind === "well"
    ? "井"
    : props.detail.kind === "station"
      ? "站库"
      : "管线",
);

const chart = computed(() => {
  const values = props.detail.kind === "well" ? props.detail.history ?? [] : [];
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 32 - ((value - min) / span) * 28;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return {
    points,
    area: `M0,34 L${points.replace(/ /g, " L")} L100,34 Z`,
    id: `lgis-spark-${props.detail.id}`,
  };
});
</script>

<template>
  <section class="lgis-panel lgis-detail">
    <div class="lgis-panel__head">
      <div class="lgis-panel__title">
        <span class="lgis-panel__bar"></span>
        对象详情
        <small>FEATURE DETAIL</small>
      </div>
      <button class="lgis-icon-btn" type="button" title="关闭详情" @click="emit('close')">
        <AfIcon name="close" :size="14" />
      </button>
    </div>

    <div class="lgis-detail__body">
      <div class="lgis-detail__hero">
        <span class="lgis-detail__icon" :class="`is-${detail.kind}`">
          <AfIcon :name="iconName" :size="18" />
        </span>
        <div class="lgis-detail__copy">
          <strong>{{ detail.name }}</strong>
          <span>{{ detail.subtitle }}</span>
        </div>
        <em class="lgis-chip" :class="`is-${detail.statusTone}`">{{ detail.statusLabel }}</em>
      </div>

      <div class="lgis-detail__metrics">
        <div
          v-for="metric in detail.metrics"
          :key="metric.label"
          class="lgis-metric"
          :class="`is-${metric.tone ?? 'default'}`"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong>
        </div>
      </div>

      <div v-if="chart" class="lgis-detail__chart">
        <div class="lgis-detail__chart-head">
          <span>近 24 小时产量趋势</span>
          <small>HISTORY</small>
        </div>
        <svg viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient :id="chart.id" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(245, 165, 36, 0.32)" />
              <stop offset="100%" stop-color="rgba(245, 165, 36, 0)" />
            </linearGradient>
          </defs>
          <path :d="chart.area" :fill="`url(#${chart.id})`" />
          <polyline :points="chart.points" fill="none" stroke="#f5a524" stroke-width="1.2" />
        </svg>
      </div>

      <div class="lgis-detail__meta">
        <div v-for="item in detail.meta" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>

      <div class="lgis-detail__actions">
        <button class="lgis-btn is-primary" type="button" @click="emit('locate')">
          <AfIcon name="focus" :size="14" />定位
        </button>
        <button
          v-if="detail.kind === 'well'"
          class="lgis-btn"
          type="button"
          @click="emit('profile')"
        >
          <AfIcon name="underground" :size="14" />井轨迹
        </button>
        <button class="lgis-btn is-ghost" type="button" @click="emit('close')">关闭</button>
        <span class="lgis-detail__kind">{{ kindLabel }} / {{ detail.id }}</span>
      </div>
    </div>
  </section>
</template>
