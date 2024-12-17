<template>
  <div class="leaflet-container">
    <div id="map" class="h-full w-full"></div>
    <el-icon :color="color" class="draw-icon" @click="draw">
      <Edit />
    </el-icon>
  </div>
</template>

<script lang="ts">
export default { name: "" };
</script>
<script lang="ts" setup>
import { CesiumData } from "@/types/gis";
import { useLeaflet } from "./leaflet2";
import { computed, onMounted, reactive } from "vue";
import { Edit } from "@element-plus/icons-vue";

const props = defineProps({
  data: {
    type: Array<CesiumData>,
    default: () => [],
  },
});
const state = reactive({
  drawing: false,
});
const color = computed(() =>
  state.drawing ? "var(--el-color-primary)" : "var(--el-color-info)"
);
const {
  map,
  drawLine,
  nearestPoints,
  getNearestPointOnLine,
  removeLinsener,
  lineLength,
  drawLongLine,
} = useLeaflet("map", props.data);
const emits = defineEmits(["getPoints"]);

/**
 * @description 是否画线
 */
const draw = () => {
  state.drawing = !state.drawing;
  if (state.drawing) {
    drawLine();
  } else {
    removeLinsener();
    getNearestPointOnLine();
    drawLongLine();
    emits("getPoints", nearestPoints, lineLength);
  }
};

onMounted(() => {
  emits("getPoints", nearestPoints, lineLength);
});
</script>

<style lang="scss" scoped>
.leaflet-container {
  width: 400px;
  height: 400px;
  position: relative;
  .draw-icon {
    position: absolute;
    top: 5px;
    right: 5px;
    cursor: pointer;
    z-index: 400;
    font-size: 18px;
    background-color: #fff;
    padding: 2px;
  }
}
</style>
