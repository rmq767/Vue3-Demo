<script lang="ts" setup>
import { computed } from "vue";
import { state } from "./store";

function format(value: number, digits = 0): string {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const items = computed(() => {
  const stats = state.stats;
  const openRate = stats.totalWells ? (stats.openWells / stats.totalWells) * 100 : 0;
  const activeAlarms = state.alarms.filter((alarm) => alarm.status !== "resolved").length;
  const sweetGas = stats.totalSweetGas ?? stats.totalGas * 0.884;
  return [
    {
      key: "gas",
      label: "日产气",
      value: format(stats.totalGas, 1),
      unit: "万m³/d",
      tone: "success",
      hint: `${stats.openWells} 口开井`,
    },
    {
      key: "sweet",
      label: "外输净化气",
      value: format(sweetGas, 1),
      unit: "万m³/d",
      tone: "primary",
      hint: "脱硫净化后外输",
    },
    {
      key: "open",
      label: "开井率",
      value: format(openRate, 1),
      unit: "%",
      tone: "info",
      hint: `${stats.openWells} / ${stats.totalWells} 口`,
    },
    {
      key: "pipe",
      label: "集输里程",
      value: format(stats.pipelineKm, 1),
      unit: "km",
      tone: "primary",
      hint: `${stats.pipelineCount ?? 0} 条管线`,
    },
    {
      key: "alarm",
      label: "活动告警",
      value: format(activeAlarms || stats.alarmCount, 0),
      unit: "项",
      tone: activeAlarms > 0 ? "warning" : "success",
      hint: activeAlarms > 0 ? "需要关注" : "运行平稳",
    },
  ];
});
</script>

<template>
  <div class="af-kpis">
    <div
      v-for="item in items"
      :key="item.key"
      class="af-kpi"
      :class="`af-kpi--${item.tone}`"
    >
      <div class="af-kpi__label">
        <span class="af-kpi__dot"></span>
        {{ item.label }}
      </div>
      <div class="af-kpi__value">
        {{ item.value }}<small>{{ item.unit }}</small>
      </div>
      <div class="af-kpi__hint">{{ item.hint }}</div>
    </div>
  </div>
</template>
