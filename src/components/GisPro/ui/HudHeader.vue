<script lang="ts" setup>
import { computed } from "vue";
import AfIcon from "./AfIcon.vue";
import KpiStrip from "./KpiStrip.vue";
import { state } from "./store";

const emit = defineEmits<{ fullscreen: [] }>();

const imageryLabel = computed(() => {
  if (state.imagery === "esri") return "卫星影像在线";
  if (state.imagery === "gaode") return "高德影像在线";
  if (state.imagery === "local") return "局部地形底图";
  if (state.imagery === "offline") return "离线网格底图";
  return "连接影像服务";
});

const imageryHint = computed(() => {
  if (state.imagery === "esri") return "ESRI / WGS84";
  if (state.imagery === "gaode") return "AMAP / DEMO";
  if (state.imagery === "local") return "LOCAL TERRAIN / DEMO";
  if (state.imagery === "offline") return "GRID FALLBACK";
  return "CONNECTING";
});
</script>

<template>
  <header class="af-header">
    <div class="af-brand">
      <div class="af-brand__mark" aria-hidden="true">
        <span class="af-brand__orbit"></span>
        <span class="af-brand__orbit af-brand__orbit--two"></span>
        <i></i>
      </div>
      <div class="af-brand__copy">
        <strong>AURORA FIELD</strong>
        <div>极光油田 <em>·</em> 智慧生产指挥中心</div>
        <small>DIGITAL TWIN / PRODUCTION COMMAND</small>
      </div>
    </div>

    <KpiStrip />

    <div class="af-header__right">
      <div class="af-clock">
        <strong>{{ state.clock }}</strong>
        <span>{{ state.date }}</span>
      </div>
      <div class="af-header__status">
        <span class="af-led" :class="{ 'is-offline': state.imagery === 'offline' }"></span>
        <div>
          <b>{{ imageryLabel }}</b>
          <small>{{ imageryHint }} · 演示数据</small>
        </div>
      </div>
      <button class="af-icon-btn" type="button" title="全屏" @click="emit('fullscreen')">
        <AfIcon name="fullscreen" :size="17" />
      </button>
    </div>
  </header>
</template>
