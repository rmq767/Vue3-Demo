<template>
  <div class="gis-container">
    <div id="cesium"></div>
  </div>
</template>

<script lang="ts">
export default { name: "GIS" };
</script>
<script lang="ts" setup>
import {
  initCesium,
  useDraw,
  getCenterPoint,
  getLongestDistance,
} from "@/components/Gis";
import { CesiumData } from "@/types/gis";
import { nextTick, onMounted, onUnmounted, watch } from "vue";
import * as Cesium from "cesium";

const props = defineProps({
  data: {
    type: Array<CesiumData>,
    default: () => [],
  },
});

let {
  viewer,
  // zoomFn,
  // loadRoadNetwork,
  destroyed,
  init,
  adjustNorthUp,
  flyTo,
  // orbitTickFunction,
  // getFrame
} = initCesium({
  max: 1000_000,
  min: 3000,
});
const { drawMapByData, initHoverEvent } = useDraw(viewer);

watch(
  () => props.data,
  (newVal) => {
    nextTick(() => {
      const allPoints = drawMapByData(newVal);
      if (allPoints.length) {
        const [longitude, latitude] = getCenterPoint(allPoints);
        const { maxDistance } = getLongestDistance(allPoints);
        flyTo(longitude, latitude, maxDistance);
        adjustNorthUp();
      }
    });
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  init();
});
onUnmounted(() => {
  destroyed();
});
</script>

<style lang="scss" scoped>
.gis-container {
  width: 200px;
  height: 200px;
  #cesium {
    width: 100%;
    height: 100%;
  }
}
</style>
