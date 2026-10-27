<script lang="ts" setup>
import { computed } from "vue";
import AfIcon from "./AfIcon.vue";
import { actions, state } from "./store";

const chapters = [
  { label: "全景", sub: "OVERVIEW" },
  { label: "井场", sub: "WELL PAD" },
  { label: "井轨迹", sub: "WELL LOG" },
  { label: "管网", sub: "PIPELINE" },
  { label: "站库", sub: "STATION" },
];

const playIcon = computed(() => {
  if (state.introPlaying) return "next";
  return state.tourPlaying ? "pause" : "play";
});

const playLabel = computed(() => {
  if (state.introPlaying) return "跳过";
  return state.tourPlaying ? "暂停" : "播放";
});

const playTitle = computed(() => {
  if (state.introPlaying) return "跳过开场";
  return state.tourPlaying ? "暂停巡演" : "播放巡演";
});

function togglePlay(): void {
  if (state.introPlaying) {
    actions.skipIntro();
    return;
  }
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
          <span class="af-tour__num">0{{ index + 1 }}</span>
          <span class="af-tour__label">{{ chapter.label }}</span>
          <small>{{ chapter.sub }}</small>
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
