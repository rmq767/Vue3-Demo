<script lang="ts" setup>
import { computed } from "vue";
import AfIcon from "./AfIcon.vue";
import { actions, state } from "./store";

const chapters = [
  { label: "全景" },
  { label: "平台" },
  { label: "井轨迹" },
  { label: "管网" },
  { label: "站库" },
];

const playIcon = computed(() => (state.tourPlaying ? "pause" : "play"));
const playLabel = computed(() => (state.tourPlaying ? "暂停" : "播放"));
const playTitle = computed(() => (state.tourPlaying ? "暂停巡演" : "播放巡演"));

function togglePlay(): void {
  if (state.tourPlaying) {
    actions.pauseTour();
  } else {
    actions.playTour();
  }
}
</script>

<template>
  <div class="af-tour-wrap">
    <transition name="af-caption">
      <div v-if="state.caption.visible" class="af-caption">
        <span class="af-caption__line"></span>
        <div>
          <strong>{{ state.caption.label }}</strong>
          <p>{{ state.caption.subtitle }}</p>
        </div>
      </div>
    </transition>

    <div class="af-tour">
      <button
        class="af-tour__play"
        type="button"
        :aria-label="playTitle"
        :title="playTitle"
        @click="togglePlay"
      >
        <AfIcon :name="playIcon" :size="16" />
        <span>{{ playLabel }}</span>
      </button>

      <div class="af-tour__chapters">
        <div class="af-tour__progress" :style="{ width: `${state.tourProgress}%` }"></div>
        <button
          v-for="(chapter, index) in chapters"
          :key="chapter.label"
          type="button"
          class="af-tour__chapter"
          :class="{
            'is-active': state.tourChapter === index,
            'is-done': index < state.tourChapter,
          }"
          @click="actions.goToChapter(index)"
        >
          <span class="af-tour__label">{{ chapter.label }}</span>
        </button>
      </div>

      <button
        class="af-tour__next"
        type="button"
        aria-label="下一章"
        title="下一章"
        @click="actions.nextChapter()"
      >
        <span>下一章</span>
        <AfIcon name="arrow-right" :size="13" />
      </button>
    </div>
  </div>
</template>
