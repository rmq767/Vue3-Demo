<template>
  <div class="leaflet-container" :class="{ collpased: state.isCollpased }">
    <div class="map">
      <div v-if="state.type === '2d'" id="map" class="h-full w-full"></div>
      <div v-if="state.type === '3d'" id="cesium" class="h-full w-full"></div>
    </div>
    <div class="action">
      <div class="direction">
        <span>北</span>
        <img src="@/assets/image.png" alt="" />
      </div>
      <div class="type" @click="changeType">
        {{ state.type === "2d" ? "3D" : "2D" }}
      </div>
    </div>
    <div class="trigger">
      <el-icon
        class="trigger-icon"
        @click="state.isCollpased = !state.isCollpased"
      >
        <DArrowLeft v-show="!state.isCollpased"></DArrowLeft>
        <DArrowRight v-show="state.isCollpased"></DArrowRight>
      </el-icon>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "" };
</script>
<script lang="ts" setup>
import { CesiumData } from "@/types/gis";
import { useLeaflet } from "./leaflet3";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { DArrowLeft, DArrowRight } from "@element-plus/icons-vue";
import { initCesium } from "./cesium";

const props = defineProps({
  data: {
    type: Array<CesiumData>,
    default: () => [],
  },
});
const state = reactive({
  isCollpased: false,
  type: "3d",
});
const checked = ref<string[]>(["1676779130877161474"]);
const { drawPoint, initMap, destroyMap } = useLeaflet("map", checked);
const { init, setCameraPosition, drawCesiumPoint } = initCesium(
  "cesium",
  checked
);
const emit = defineEmits(["checked"]);

watch(
  () => checked.value,
  (newVal) => {
    setData(newVal);
  },
  {
    deep: true,
  }
);

const setData = (value: string[]) => {
  const data = [] as any[];
  value.forEach((item) => {
    let y = 0;
    let x = 0;
    let maxSize = 0;
    let minSize = 0;
    const well = props.data.find((i) => i.businessId === item);
    if (well) {
      const info = well.info.map((i, index) => {
        if (index === 0) {
          maxSize = i.size!;
          minSize = i.size!;
          return {
            ...i,
            width: 0,
            height: 0,
          };
        } else {
          maxSize = Math.max(i.size!, well.info[index - 1].size!, maxSize);
          minSize = Math.min(i.size!, well.info[index - 1].size!, minSize);
          const tvd = i.tvd! - well.info[index - 1].tvd!;
          const md = i.md! - well.info[index - 1].md!;
          y += md;
          const width = Number((md * md - tvd * tvd).toFixed(2));
          x += width;
          return {
            ...i,
            width: x,
            height: y,
          };
        }
      });
      data.push({
        ...well,
        info,
        length: Number(x.toFixed(2)),
        distance: Number(y.toFixed(2)),
        maxSize,
        minSize,
      });
    }
  });
  emit("checked", data);
};

const changeType = () => {
  if (state.type === "3d") {
    state.type = "2d";
    destroyMap();
    nextTick(() => {
      initMap();
      drawPoint(props.data);
    });
  } else {
    state.type = "3d";
    nextTick(() => {
      init();
      setCameraPosition(props.data);
      drawCesiumPoint(props.data);
    });
  }
};

onMounted(() => {
  if (state.type === "3d") {
    nextTick(() => {
      init();
      setCameraPosition(props.data);
      drawCesiumPoint(props.data);
    });
  } else {
    initMap();
    drawPoint(props.data);
  }
  setData(checked.value);
});
</script>

<style lang="scss" scoped>
.leaflet-container {
  overflow: visible;
  width: 300px;
  height: 300px;
  position: relative;
  background-color: transparent;
  transition: all 0.3s;
  .map {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
  .action {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 400;
    background-color: #fff;
    padding: 6px 4px;
    .direction {
      display: flex;
      flex-direction: column;
      align-items: center;
      img {
        width: 20px;
        height: 20px;
      }
    }
    .type {
      cursor: pointer;
      background-color: #ccc;
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  .trigger {
    position: absolute;
    bottom: 0;
    right: -22px;
    background-color: #fcf9f2;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  [class*="-icon"] {
    z-index: 400;
    font-size: 18px;
    cursor: pointer;
    padding: 2px;
  }
}
.collpased {
  transform: translateX(-100%);
}
:deep(.leaflet-tooltip.tooltip) {
  background-color: var(--el-color-primary);
  color: #fff;
  &.leaflet-tooltip-top:before {
    border-top-color: var(--el-color-primary);
  }
}
</style>
