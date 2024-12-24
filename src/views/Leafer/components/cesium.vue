<template>
  <div id="cesium"></div>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import { nextTick, onMounted } from "vue";
import { initCesium } from "./cesium";

let {
  viewer,
  destroyed,
  init,
  adjustNorthUp,
  flyTo,
  orbitTickFunction,
  getFrame,
} = initCesium();

onMounted(() => {
  nextTick(() => {
    // 初始化cesium
    init();
  });
});
</script>

<style lang="scss" scoped></style>
