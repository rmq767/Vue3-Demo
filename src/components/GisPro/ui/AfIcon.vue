<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
    strokeWidth?: number;
  }>(),
  { size: 16, strokeWidth: 1.6 },
);

const icons: Record<string, string[]> = {
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "m20 20-4-4"],
  layers: ["m12 3 9 5-9 5-9-5 9-5Z", "m3 12 9 5 9-5", "m3 16 9 5 9-5"],
  play: ["M8 5.5v13l11-6.5-11-6.5Z"],
  pause: ["M8 5h3v14H8z", "M13 5h3v14h-3z"],
  next: ["M6 5.5v13l9-6.5-9-6.5Z", "M18 5v14"],
  fullscreen: ["M4 9V4h5", "M20 15v5h-5", "M20 9V4h-5", "M4 15v5h5"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  chevron: ["m9 6 6 6-6 6"],
  "chevron-down": ["m6 9 6 6 6-6"],
  well: ["M4 20h16", "M7 20 12 5l5 15", "M9 13h6", "M12 5v2"],
  station: [
    "M4 20V9h5v11",
    "M4 9c0-1.7 2.2-3 5-3s5 1.3 5 3",
    "M15 20v-8h5v8",
    "M15 12c0-1.2 1.1-2 2.5-2S20 10.8 20 12",
  ],
  pipeline: ["M3 12h18", "M6 9v6", "M12 9v6", "M18 9v6"],
  alarm: ["M12 3 2.8 20h18.4L12 3Z", "M12 9v5", "M12 17h.01"],
  underground: ["M3 8h18", "M3 12h18", "M3 16h18", "m9 20 3-2 3 2"],
  labels: ["M4 5h16v6l-6 6H4V5Z", "M8 9h.01", "M12 9h.01"],
  reset: ["M20 11a8 8 0 1 0-2.3 5.7", "M20 4v7h-7"],
  focus: [
    "M12 3v4",
    "M12 17v4",
    "M3 12h4",
    "M17 12h4",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  ],
  flame: [
    "M12 21c4 0 6-2.8 6-6 0-4-3-5.5-4-9-1 2-3.5 3.8-3.5 6.5 0 1.2.4 2 .4 2S10 13 10 11.5C8.5 13 6 14.5 6 17c0 2.4 2 4 6 4Z",
  ],
  drop: ["M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"],
  gauge: ["M4 16a8 8 0 1 1 16 0", "m12 12 4-3", "M12 16h.01"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
  "arrow-up": ["m6 15 6-6 6 6"],
  "arrow-right": ["M4 12h15", "m13 6 6 6-6 6"],
  check: ["m5 12 4 4L19 6"],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 11v5", "M12 8h.01"],
  spark: ["m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"],
  power: ["M12 3v9", "M7 6.5a8 8 0 1 0 10 0"],
  eye: ["M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
  sun: [
    "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
    "M12 2v2",
    "M12 20v2",
    "M4.9 4.9l1.4 1.4",
    "M17.7 17.7l1.4 1.4",
    "M2 12h2",
    "M20 12h2",
    "M4.9 19.1l1.4-1.4",
    "M17.7 6.3l1.4-1.4",
  ],
  moon: ["M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"],
  dot: ["M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"],
};

const paths = computed(() => icons[props.name] ?? icons.dot);
const isFilled = computed(() => props.name === "play" || props.name === "pause" || props.name === "next");
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="af-icon"
  >
    <path
      v-for="(d, index) in paths"
      :key="index"
      :d="d"
      :fill="isFilled ? 'currentColor' : 'none'"
      :stroke="isFilled ? 'none' : 'currentColor'"
    />
  </svg>
</template>
