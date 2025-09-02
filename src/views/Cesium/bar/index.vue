<template>
  <div class="cesium">
    <div id="cesium-container"></div>
    <div
      class="tooltips"
      :style="{
        top: `${tooltips.y}px`,
        left: `${tooltips.x}px`,
        display: `${tooltips.show ? 'block' : 'none'}`,
      }"
    >
      <div class="name">名称：{{ tooltips.info.name }}</div>
      <div class="value">值：{{ tooltips.info.value }}</div>
      <div class="desc">描述：{{ tooltips.info.desc }}</div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import { useCesium } from ".";

const { tooltips } = useCesium("cesium-container");
</script>

<style lang="scss" scoped>
#cesium-container,
.cesium {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.tooltips {
  position: absolute;
  display: none;
  background-color: rgba($color: #000000, $alpha: 0.6);
  color: #fff;
  width: 20vw;
  padding: 1rem;
  font-size: 12px;
  border-radius: 4px;
  > div + div {
    margin-top: 0.2rem;
  }
}
</style>
