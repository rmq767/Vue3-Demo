<template>
  <div class="bg">
    <div class="text">Hello World</div>
    <input type="range" min="-1" max="0" step="0.1" v-model="value" />
  </div>
</template>

<script lang="ts">
export default { name: "Home" };
</script>
<script lang="ts" setup>
import { computed, ref } from "vue";

const value = ref(-0.5);
const s = computed(() => {
  return value.value.toString() + "s";
});
</script>

<style lang="scss" scoped>
.bg {
  background-image: linear-gradient(70deg, #000, #000 50%, #fff 50%);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.text {
  --delay: v-bind(s);
  font-size: 60px;
  mix-blend-mode: difference;
  color: white;
  transform: translateX(-300px);
  animation: move 1s ease-in-out var(--delay);
  animation-play-state: paused;
}
@keyframes move {
  0% {
    transform: translateX(300px);
  }
  100% {
    transform: translateX(-300px);
  }
}
</style>
