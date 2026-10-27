<script lang="ts">
export default { name: "GisToolbar" };
</script>

<script lang="ts" setup>
import type { BasemapMode } from "../core/viewer";

defineProps<{
  is2D: boolean;
  measuring: boolean;
  trajectoryOn: boolean;
  basemap: BasemapMode;
  effectsOn: boolean;
  realtimeOn: boolean;
  morphing: boolean;
  totalLabel: string;
}>();

const emit = defineEmits<{
  (event: "reset"): void;
  (event: "toggle-measure"): void;
  (event: "toggle-mode"): void;
  (event: "toggle-trajectory"): void;
  (event: "toggle-basemap"): void;
  (event: "toggle-effects"): void;
  (event: "toggle-realtime"): void;
  (event: "fullscreen"): void;
}>();
</script>

<template>
  <div class="gis-toolbar-wrap">
    <transition name="gis-fade">
      <div v-if="measuring" class="gis-measure-hud">
        <span class="gis-measure-hint">单击取点 · 右键撤销 · Esc 结束</span>
        <strong v-if="totalLabel">总长 {{ totalLabel }}</strong>
      </div>
    </transition>

    <div class="gis-toolbar">
      <button type="button" class="gis-tool" title="复位视角" @click="emit('reset')">
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r="7.2"></circle>
          <path d="M11 3.8v3.1M11 15.1v3.1M3.8 11h3.1M15.1 11h3.1"></path>
        </svg>
        <span>复位</span>
      </button>

      <button
        type="button"
        class="gis-tool"
        :class="{ 'is-active': measuring }"
        title="距离测量"
        @click="emit('toggle-measure')"
      >
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <path d="M3.4 14.6 14.6 3.4l4 4L7.4 18.6z"></path>
          <path d="M6.6 11.4l1.8 1.8M9.2 8.8l1.8 1.8M11.8 6.2l1.8 1.8M14.4 3.6l1.8 1.8"></path>
        </svg>
        <span>测距</span>
      </button>

      <span class="gis-tool-divider"></span>

      <button
        type="button"
        class="gis-tool"
        :class="{ 'is-active': is2D }"
        :disabled="morphing"
        title="二三维切换"
        @click="emit('toggle-mode')"
      >
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <path d="M11 2.8 19 7v8l-8 4.2L3 15V7z"></path>
          <path d="M3 7l8 4.2L19 7M11 11.2v8"></path>
        </svg>
        <span>{{ morphing ? "切换中" : is2D ? "2D" : "3D" }}</span>
      </button>

      <button
        type="button"
        class="gis-tool"
        :class="{ 'is-active': trajectoryOn }"
        :disabled="is2D"
        :title="is2D ? '井轨迹地下透视（需切回 3D）' : '井轨迹地下透视'"
        @click="emit('toggle-trajectory')"
      >
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <path d="M4 4h9M4 4v9M18 18h-4M18 18v-6M4 13v5h5M13 4h5v5"></path>
          <path d="M7 7h8v8H7z"></path>
        </svg>
        <span>井轨迹</span>
      </button>

      <button
        type="button"
        class="gis-tool"
        :class="{ 'is-active': basemap === 'satellite' }"
        :title="basemap === 'dark' ? '切换卫星影像' : '切换暗色矢量'"
        @click="emit('toggle-basemap')"
      >
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <path d="M3 5.6 8.4 3v14.4L3 19.8zM8.4 3 14 5.4v14.6l-5.6-2.4zM14 5.4 19 3v14.4l-5 2.4z"></path>
        </svg>
        <span>{{ basemap === "dark" ? "暗色底图" : "卫星底图" }}</span>
      </button>

      <span class="gis-tool-divider"></span>

      <button
        type="button"
        class="gis-tool"
        :class="{ 'is-active': effectsOn }"
        title="动态特效"
        @click="emit('toggle-effects')"
      >
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <path d="M11 2.6l1.7 5 5.1 1.7-5.1 1.7-1.7 5-1.7-5-5.1-1.7 5.1-1.7z"></path>
          <path d="M17.6 14.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"></path>
        </svg>
        <span>特效</span>
      </button>

      <button
        type="button"
        class="gis-tool"
        :class="{ 'is-active': realtimeOn }"
        title="实时模拟"
        @click="emit('toggle-realtime')"
      >
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r="2.4"></circle>
          <path d="M6.2 6.2a6.8 6.8 0 0 0 0 9.6M15.8 6.2a6.8 6.8 0 0 1 0 9.6M3.4 3.4a10.8 10.8 0 0 0 0 15.2M18.6 3.4a10.8 10.8 0 0 1 0 15.2"></path>
        </svg>
        <span>实时</span>
      </button>

      <button type="button" class="gis-tool" title="全屏" @click="emit('fullscreen')">
        <svg viewBox="0 0 22 22" aria-hidden="true">
          <path d="M3.6 8V3.6H8M14 3.6h4.4V8M18.4 14v4.4H14M8 18.4H3.6V14"></path>
        </svg>
        <span>全屏</span>
      </button>
    </div>
  </div>
</template>
