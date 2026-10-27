<script lang="ts">
export default { name: "GisHeader" };
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { HeaderStats } from "../data/types";

const props = defineProps<{
  stats: HeaderStats;
  clock: string;
  date: string;
  realtimeOn: boolean;
}>();

const fresh = ref(false);
let freshTimer = 0;

watch(
  () => [
    props.stats.wells,
    props.stats.openWells,
    props.stats.gas,
    props.stats.pipelineKm,
    props.stats.alarms,
  ],
  () => {
    fresh.value = true;
    window.clearTimeout(freshTimer);
    freshTimer = window.setTimeout(() => {
      fresh.value = false;
    }, 760);
  },
);

onBeforeUnmount(() => window.clearTimeout(freshTimer));

const items = computed(() => [
  { label: "总井数", value: `${props.stats.wells}`, unit: "口" },
  { label: "开井数", value: `${props.stats.openWells}`, unit: "口" },
  { label: "日产气", value: props.stats.gas.toFixed(1), unit: "万方" },
  { label: "管网长度", value: props.stats.pipelineKm.toFixed(1), unit: "km" },
  { label: "活动告警", value: `${props.stats.alarms}`, unit: "条", alert: props.stats.alarms > 0 },
]);
</script>

<template>
  <header class="gis-header">
    <div class="gis-brand">
      <div class="gis-brand-mark" aria-hidden="true">
        <i></i><i></i><i></i>
      </div>
      <div class="gis-brand-text">
        <h1>智慧气田三维 GIS 管控平台</h1>
        <p>SMART GAS FIELD · 3D GEO-INFORMATION SYSTEM</p>
      </div>
    </div>

    <div class="gis-kpis" :class="{ 'is-fresh': fresh }">
      <div
        v-for="item in items"
        :key="item.label"
        class="gis-kpi"
        :class="{ 'is-alert': item.alert }"
      >
        <span class="gis-kpi-label">{{ item.label }}</span>
        <span class="gis-kpi-value">{{ item.value }}<em>{{ item.unit }}</em></span>
      </div>
    </div>

    <div class="gis-clock">
      <span class="gis-live" :class="{ 'is-off': !realtimeOn }">
        <i></i>{{ realtimeOn ? "实时" : "暂停" }}
      </span>
      <div class="gis-clock-text">
        <strong>{{ clock }}</strong>
        <small>{{ date }}</small>
      </div>
    </div>
  </header>
</template>
