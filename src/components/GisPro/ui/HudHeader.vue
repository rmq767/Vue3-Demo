<script lang="ts" setup>
import { computed } from "vue";
import AfIcon from "./AfIcon.vue";
import KpiStrip from "./KpiStrip.vue";
import { actions, state } from "./store";

const emit = defineEmits<{ fullscreen: [] }>();

const imageryLabel = computed(() => {
  if (state.imagery === "esri") return "卫星影像";
  if (state.imagery === "gaode") return "高德影像";
  if (state.imagery === "local") return "本地底图";
  if (state.imagery === "offline") return "离线网格";
  return "连接影像服务";
});

const imageryHint = computed(() => {
  if (state.imagery === "gaode") return "坐标示意 · 演示数据";
  if (state.imagery === "offline") return "离线网格 · 演示数据";
  if (state.imagery === "esri") return "影像 © Esri · 演示数据";
  return "演示数据 · 非实时生产数据";
});
</script>

<template>
  <header class="af-header">
    <div class="af-brand">
      <div class="af-brand__mark" aria-hidden="true">
        <AfIcon name="well" :size="20" />
      </div>
      <div class="af-brand__copy">
        <strong>川西气田</strong>
        <div>生产运行监控</div>
        <small>彭州市 · 演示数据</small>
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
          <small>{{ imageryHint }}</small>
        </div>
      </div>
      <button
        class="af-icon-btn af-theme-btn"
        type="button"
        role="switch"
        :aria-checked="state.theme === 'dark'"
        :aria-label="state.theme === 'dark' ? '切换为亮色主题' : '切换为暗色主题'"
        :title="state.theme === 'dark' ? '切换为亮色主题' : '切换为暗色主题'"
        @click="actions.toggleTheme()"
      >
        <AfIcon :name="state.theme === 'dark' ? 'sun' : 'moon'" :size="16" />
      </button>
      <button class="af-icon-btn" type="button" title="全屏" @click="emit('fullscreen')">
        <AfIcon name="fullscreen" :size="17" />
      </button>
    </div>
  </header>
</template>
