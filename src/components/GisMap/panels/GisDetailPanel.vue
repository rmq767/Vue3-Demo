<script lang="ts">
export default { name: "GisDetailPanel" };
</script>

<script lang="ts" setup>
import { computed } from "vue";
import type {
  Alarm,
  BlockRankingItem,
  FieldData,
  GisFeature,
  Pipeline,
  Platform,
  Well,
} from "../data/types";
import { pipelineStatusLabel } from "../data/field";
import GisProfileChart from "./GisProfileChart.vue";

const props = defineProps<{
  feature: GisFeature | null;
  field: FieldData;
  blockRanking: BlockRankingItem[];
  alarms: Alarm[];
  is2D: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "focus", id: string): void;
  (event: "select", id: string): void;
  (event: "show-trajectory", id: string): void;
}>();

const well = computed<Well | null>(() => (props.feature?.kind === "well" ? props.feature : null));
const block = computed(() => (props.feature?.kind === "block" ? props.feature : null));
const platform = computed<Platform | null>(() =>
  props.feature?.kind === "platform" ? props.feature : null,
);
const pipeline = computed<Pipeline | null>(() =>
  props.feature?.kind === "pipeline" ? props.feature : null,
);

const kindLabel = computed(() => {
  if (!props.feature) return "FIELD OVERVIEW";
  if (props.feature.kind === "block") return "区块";
  if (props.feature.kind === "well") return "井位";
  if (props.feature.kind === "platform") return "平台";
  return "管道";
});

const statusText = computed(() => {
  if (pipeline.value) return pipelineStatusLabel(pipeline.value.runStatus);
  const status = props.feature?.status;
  if (status === "warning") return "参数预警";
  if (status === "offline") return "停产";
  return "运行正常";
});

const statusClass = computed(() => {
  if (pipeline.value) {
    if (pipeline.value.runStatus === "maintenance") return "is-warning";
    if (pipeline.value.runStatus === "stopped") return "is-offline";
    return "is-normal";
  }
  if (props.feature?.status === "warning") return "is-warning";
  if (props.feature?.status === "offline") return "is-offline";
  return "is-normal";
});

const blockName = computed(() => {
  if (!well.value) return "—";
  return props.field.blocks.find((item) => item.id === well.value?.blockId)?.name ?? "—";
});

const platformName = computed(() => {
  if (!well.value?.platformId) return "—";
  return (
    props.field.platforms.find((item) => item.id === well.value?.platformId)?.name ?? "—"
  );
});

const wellMetrics = computed(() => {
  if (!well.value) return [];
  return [
    { label: "井型", value: well.value.wellType },
    { label: "井深", value: `${well.value.depth} m` },
    { label: "日产气", value: `${well.value.dailyGas.toFixed(1)} 万方` },
    { label: "套压", value: `${well.value.pressure.toFixed(1)} MPa` },
    { label: "井口温度", value: `${well.value.temperature.toFixed(1)} ℃` },
  ];
});

const blockMetrics = computed(() => {
  if (!block.value) return [];
  return [
    { label: "区块面积", value: `${block.value.areaKm2} km²` },
    { label: "日产气", value: `${block.value.dailyGas.toFixed(1)} 万方` },
    { label: "井数", value: `${block.value.wellCount} 口` },
    { label: "开发状态", value: statusText.value },
  ];
});

const platformMetrics = computed(() => {
  if (!platform.value) return [];
  return [
    { label: "平台类型", value: platform.value.type },
    { label: "设计产能", value: `${platform.value.capacity} 万方/日` },
    { label: "日产气", value: `${platform.value.dailyGas.toFixed(1)} 万方` },
    { label: "接入井数", value: `${platform.value.wellIds.length} 口` },
  ];
});

const pipelineMetrics = computed(() => {
  if (!pipeline.value) return [];
  const flowText =
    pipeline.value.runStatus === "running"
      ? `${pipeline.value.flow} ${pipeline.value.medium === "天然气" ? "万方/日" : pipeline.value.medium === "污水" ? "m³/日" : "t/日"}`
      : "—";
  return [
    { label: "介质", value: pipeline.value.medium },
    { label: "管径", value: `DN${pipeline.value.diameter}` },
    { label: "设计压力", value: `${pipeline.value.designPressure} MPa` },
    { label: "长度", value: `${pipeline.value.lengthKm.toFixed(2)} km` },
    { label: "当前流量", value: flowText },
  ];
});

const blockWells = computed(() => {
  if (!block.value) return [];
  return props.field.wells
    .filter((item) => item.blockId === block.value?.id)
    .sort((a, b) => b.dailyGas - a.dailyGas)
    .slice(0, 6);
});

const platformWells = computed(() => {
  if (!platform.value) return [];
  return props.field.wells.filter((item) => item.platformId === platform.value?.id);
});

const platformPipelines = computed(() => {
  if (!platform.value) return [];
  return props.field.pipelines.filter(
    (item) =>
      item.fromName === platform.value?.name || item.toName === platform.value?.name,
  );
});
</script>

<template>
  <section class="gis-panel gis-detail-panel">
    <div v-if="feature" class="gis-detail-head">
      <div class="gis-detail-title">
        <span class="gis-kind">{{ kindLabel }}</span>
        <h2>{{ feature.name }}</h2>
        <span class="gis-status" :class="statusClass">{{ statusText }}</span>
      </div>
      <button class="gis-icon-btn" type="button" aria-label="关闭详情" @click="emit('close')">
        ×
      </button>
    </div>

    <div v-if="feature" class="gis-detail-scroll">
      <div v-if="well" class="gis-detail-body">
        <div class="gis-metrics">
          <div v-for="item in wellMetrics" :key="item.label" class="gis-metric">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <div class="gis-info-rows">
          <div><span>所属区块</span><strong>{{ blockName }}</strong></div>
          <div><span>所属平台</span><strong>{{ platformName }}</strong></div>
        </div>
        <GisProfileChart :trajectory="well.trajectory" :history="well.history" />
        <div class="gis-detail-actions">
          <button type="button" class="gis-btn" @click="emit('focus', well.id)">聚焦井位</button>
          <button
            type="button"
            class="gis-btn is-primary"
            :disabled="!well.trajectory || is2D"
            :title="is2D ? '井轨迹仅支持三维视图' : undefined"
            @click="emit('show-trajectory', well.id)"
          >
            {{ is2D ? "需切回 3D" : "查看井轨迹" }}
          </button>
        </div>
      </div>

      <div v-else-if="block" class="gis-detail-body">
        <div class="gis-metrics">
          <div v-for="item in blockMetrics" :key="item.label" class="gis-metric">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <div class="gis-section-title">区块井位 <em>{{ blockWells.length }}</em></div>
        <button
          v-for="item in blockWells"
          :key="item.id"
          type="button"
          class="gis-list-row"
          @click="emit('select', item.id)"
        >
          <span>{{ item.name }}</span>
          <em>{{ item.dailyGas.toFixed(1) }} 万方/日</em>
        </button>
        <div class="gis-detail-actions">
          <button type="button" class="gis-btn is-primary" @click="emit('focus', block.id)">
            聚焦区块
          </button>
        </div>
      </div>

      <div v-else-if="platform" class="gis-detail-body">
        <div class="gis-metrics">
          <div v-for="item in platformMetrics" :key="item.label" class="gis-metric">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <div class="gis-section-title">接入井位 <em>{{ platformWells.length }}</em></div>
        <button
          v-for="item in platformWells"
          :key="item.id"
          type="button"
          class="gis-list-row"
          @click="emit('select', item.id)"
        >
          <span>{{ item.name }}</span>
          <em>{{ item.status === "warning" ? "预警" : `${item.dailyGas.toFixed(1)} 万方/日` }}</em>
        </button>
        <div class="gis-section-title">关联管道 <em>{{ platformPipelines.length }}</em></div>
        <button
          v-for="item in platformPipelines"
          :key="item.id"
          type="button"
          class="gis-list-row"
          @click="emit('select', item.id)"
        >
          <span>{{ item.name }}</span>
          <em>{{ item.medium }} · DN{{ item.diameter }}</em>
        </button>
        <div class="gis-detail-actions">
          <button type="button" class="gis-btn is-primary" @click="emit('focus', platform.id)">
            聚焦平台
          </button>
        </div>
      </div>

      <div v-else-if="pipeline" class="gis-detail-body">
        <div class="gis-metrics">
          <div v-for="item in pipelineMetrics" :key="item.label" class="gis-metric">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <div class="gis-info-rows">
          <div><span>起点</span><strong>{{ pipeline.fromName }}</strong></div>
          <div><span>终点</span><strong>{{ pipeline.toName }}</strong></div>
        </div>
        <div class="gis-detail-actions">
          <button type="button" class="gis-btn is-primary" @click="emit('focus', pipeline.id)">
            聚焦管线
          </button>
        </div>
      </div>
    </div>

    <div v-else class="gis-detail-scroll">
      <div class="gis-overview-head">
        <span class="gis-kind">FIELD OVERVIEW</span>
        <h2>气田总览</h2>
        <p>点击地图要素或使用左上角搜索查看详情</p>
      </div>
      <div class="gis-section-title">区块产量排名 <em>万方/日</em></div>
      <button
        v-for="item in blockRanking"
        :key="item.id"
        type="button"
        class="gis-rank-row"
        @click="emit('focus', item.id)"
      >
        <span class="gis-rank-name"><i :style="{ background: item.color }"></i>{{ item.name }}</span>
        <span class="gis-rank-bar"><b :style="{ width: `${item.percent}%`, background: item.color }"></b></span>
        <em>{{ item.gas.toFixed(1) }}</em>
      </button>
      <div class="gis-section-title">活动告警 <em>{{ alarms.length }}</em></div>
      <button
        v-for="alarm in alarms.slice(0, 5)"
        :key="alarm.id"
        type="button"
        class="gis-alarm-row"
        @click="emit('focus', alarm.sourceId)"
      >
        <i :class="`is-${alarm.level}`"></i>
        <span>
          <strong>{{ alarm.sourceName }}</strong>
          <small>{{ alarm.message }}</small>
        </span>
      </button>
      <div v-if="!alarms.length" class="gis-overview-empty">当前无活动告警</div>
    </div>
  </section>
</template>
