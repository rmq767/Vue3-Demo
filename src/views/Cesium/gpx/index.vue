<template>
  <div class="cesium">
    <div id="cesium-container"></div>
  </div>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import { useCesium } from "./index";

const {} = useCesium("cesium-container");
</script>

<style lang="scss" scoped>
#cesium-container,
.cesium {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
