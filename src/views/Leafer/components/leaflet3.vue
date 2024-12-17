<template>
  <div class="leaflet-container" :class="{ collpased: state.isCollpased }">
    <div class="map">
      <div id="map" class="h-full w-full"></div>
    </div>
    <div class="action">
      <span>北</span>
      <img src="@/assets/image.png" alt="" />
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
import { computed, onMounted, reactive, watch } from "vue";
import { DArrowLeft, DArrowRight } from "@element-plus/icons-vue";

const props = defineProps({
  data: {
    type: Array<CesiumData>,
    default: () => [],
  },
});
const state = reactive({
  isCollpased: false,
});
const { checked, drawPoint } = useLeaflet("map");
const emit = defineEmits(["checked"]);

watch(
  () => checked.value,
  (newVal) => {
    const data = [] as any[];
    newVal.forEach((item) => {
      let y = 0;
      let x = 0;
      const well = props.data.find((i) => i.businessId === item);
      if (well) {
        const info = well.info.map((i, index) => {
          if (index === 0) {
            return {
              ...i,
              width: 0,
              height: 0,
            };
          } else {
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
        });
      }
    });
    emit("checked", data);
  },
  {
    deep: true,
  }
);

onMounted(() => {
  drawPoint(props.data, ["1676779130877161474"]);
});
</script>

<style lang="scss" scoped>
.leaflet-container {
  overflow: visible;
  width: 400px;
  height: 400px;
  position: relative;
  background-color: transparent;
  transition: all 0.3s;
  .map {
    overflow: hidden;
  }
  .action {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 400;
    background-color: #fff;
    padding: 6px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    img {
      width: 20px;
      height: 20px;
    }
  }
  .trigger {
    position: absolute;
    bottom: 0;
    right: -22px;
  }
  [class*="-icon"] {
    z-index: 400;
    font-size: 18px;
    cursor: pointer;
    padding: 2px;
  }
}
.collpased {
  transform: translateX(-400px);
}
:deep(.leaflet-tooltip.tooltip) {
  background-color: var(--el-color-primary);
  color: #fff;
  &.leaflet-tooltip-top:before {
    border-top-color: var(--el-color-primary);
  }
}
</style>
