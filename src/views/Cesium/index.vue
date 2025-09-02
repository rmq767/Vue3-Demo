<template>
  <div id="cesiumContainer"></div>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import { useCesium } from ".";

const { viewer } = useCesium("cesiumContainer");
</script>

<style lang="scss" scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
}
</style>
