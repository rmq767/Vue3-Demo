<script lang="ts" setup>
import { computed } from "vue";
import AfIcon from "./AfIcon.vue";
import AfPanel from "./AfPanel.vue";
import { actions, state } from "./store";

const selected = computed(() => state.selected);
const inTrajectory = computed(() => state.sceneMode === "trajectory");

const sparkline = computed(() => {
  const values = selected.value?.history ?? [];
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 118 + 1;
      const y = 34 - ((value - min) / span) * 28;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
});

const accent = computed(() => {
  const key = selected.value?.colorKey ?? "primary";
  return `var(--af-${key})`;
});

const kindLabel = computed(() => {
  if (selected.value?.kind === "well") return "单井";
  if (selected.value?.kind === "station") return "站库";
  if (selected.value?.kind === "pipeline") return "管线";
  return "气田概览";
});

const overviewText = computed(() => {
  const stats = state.stats;
  return `${stats.platformCount ?? 6} 个平台 / ${stats.totalWells} 口井 / ${stats.stationCount ?? 8} 座站库 · ${stats.pipelineCount ?? 12} 条管线`;
});

function focus(): void {
  if (selected.value) actions.focus(selected.value.id);
}

function openTrajectory(): void {
  if (selected.value?.kind === "well") actions.openWellTrajectory(selected.value.id);
}

function closeDetail(): void {
  if (inTrajectory.value) actions.closeWellTrajectory();
  else actions.clearSelection();
}
</script>

<template>
  <AfPanel
    :title="selected?.name ?? '川西气田'"
    :subtitle="selected ? kindLabel : '气田概览'"
  >
    <template #extra>
      <template v-if="selected">
        <span class="af-status-tag" :class="`is-${selected.statusTone}`">
          {{ selected.statusLabel }}
        </span>
        <button
          class="af-icon-btn af-icon-btn--small"
          type="button"
          :title="inTrajectory ? '返回气田' : '关闭详情'"
          @click="closeDetail"
        >
          <AfIcon name="close" :size="14" />
        </button>
      </template>
      <span v-else class="af-mini-tag">演示数据</span>
    </template>

    <template v-if="selected">
      <div class="af-detail__hero" :style="{ '--detail-accent': accent }">
        <div class="af-detail__id">{{ selected.id }}</div>
        <p>{{ selected.subtitle }}</p>
        <div class="af-detail__spark" v-if="sparkline">
          <svg viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              :points="sparkline"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
          <span>近 24 小时</span>
        </div>
      </div>

      <div class="af-metrics">
        <div
          v-for="metric in selected.metrics"
          :key="metric.label"
          class="af-metric"
          :class="`is-${metric.tone ?? 'default'}`"
        >
          <span>{{ metric.label }}</span>
          <div>
            <strong>{{ metric.value }}</strong>
            <small v-if="metric.unit">{{ metric.unit }}</small>
          </div>
        </div>
      </div>

      <div class="af-meta">
        <div v-for="item in selected.meta" :key="item.label" class="af-meta__item">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>

      <div class="af-detail__actions">
        <template v-if="!inTrajectory">
          <button class="af-btn af-btn--primary" type="button" @click="focus">
            <AfIcon name="focus" :size="14" /> 聚焦目标
          </button>
          <button
            v-if="selected.kind === 'well'"
            class="af-btn"
            type="button"
            @click="openTrajectory"
          >
            <AfIcon name="underground" :size="14" /> 井轨迹
          </button>
        </template>
        <button class="af-btn af-btn--ghost" type="button" @click="closeDetail">
          {{ inTrajectory ? "返回气田" : "关闭" }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="af-overview">
        <div class="af-overview__head">
          <span class="af-overview__ring">
            <AfIcon name="spark" :size="18" />
          </span>
          <div>
            <strong>川西气田 · 生产运行监控</strong>
            <p>{{ overviewText }}</p>
          </div>
        </div>

        <div class="af-overview__stats">
          <div>
            <span>探明储量</span>
            <strong>{{ state.stats.reserves.toLocaleString("zh-CN") }}<small>亿m³</small></strong>
          </div>
          <div>
            <span>年产能</span>
            <strong>{{ state.stats.annualCapacity ?? 20 }}<small>亿m³/a</small></strong>
          </div>
          <div>
            <span>硫磺年产量</span>
            <strong>{{ state.stats.sulfurAnnual ?? 13 }}<small>万吨/a</small></strong>
          </div>
        </div>

        <div class="af-reservoirs">
          <div class="af-reservoirs__head">
            <span>气藏层位</span>
            <em>垂向示意</em>
          </div>
          <div v-for="reservoir in state.reservoirs" :key="reservoir.id" class="af-reservoir">
            <i :style="{ background: `var(--af-${reservoir.colorKey})` }"></i>
            <div>
              <strong>{{ reservoir.name }}</strong>
              <span>{{ reservoir.topDepth }}–{{ reservoir.bottomDepth }} m</span>
            </div>
            <em>{{ reservoir.saturation.toFixed(1) }}%</em>
          </div>
        </div>

        <div class="af-overview__hint">
          <AfIcon name="focus" :size="14" />
          点击沙盘中的井 / 站库 / 管线查看详情
        </div>
      </div>
    </template>
  </AfPanel>
</template>
