<template>
  <el-dialog
    title="地图标点"
    width="80%"
    v-model="state.visible"
    center
    top="0"
    :fullscreen="true"
    @close="close"
    class="gis-dialog"
    destroy-on-close
  >
    <div id="cesium-container">
      <div id="cesium"></div>
      <!-- <div class="filter">
        <InputSearch :filter="true" @search="search" />
      </div>
      <div class="search">
        <InputSearch @search="search" />
      </div> -->
      <div class="shortcut-keys">
        <el-button-group>
          <el-popover
            placement="bottom"
            :popper-style="{
              minWidth: '80px',
              width: '80px',
            }"
            trigger="click"
            :teleported="false"
          >
            <template #reference>
              <el-button :icon="Menu" />
            </template>
            <el-checkbox-group v-model="state.check">
              <el-checkbox
                v-for="item in filterType"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-checkbox-group>
          </el-popover>
          <el-button :icon="Cpu" @click="loadRoadMap" />
          <el-button :icon="Compass" @click="toNorth" />
          <el-button :icon="ZoomIn" @click="zoom('zoomIn')" />
          <el-button :icon="ZoomOut" @click="zoom('zoomOut')" />
          <el-button :icon="FullScreen" @click="fullScreen" />
        </el-button-group>
      </div>
      <el-button type="primary" class="save" @click="save">保存</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import { reactive } from "vue";
import { useDrawAndGetData, initCesium, filterType } from "./index";
import {
  Menu,
  Cpu,
  Compass,
  FullScreen,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
// import InputSearch from "./inputSearch.vue";
import { CesiumDataItem, CesiumDataType, CesiumFilterType } from "@/types/gis";
import { nextTick } from "vue";
import { shallowRef } from "vue";

const state = reactive({
  filter: "",
  type: "" as CesiumFilterType,
  search: "",
  radio: "",
  check: [0, 1, 2, 3, 4, 5],
  visible: false,
  drawType: CesiumDataType.Point as CesiumDataType,
});
let { viewer, zoomFn, loadRoadNetwork, destroyed, init, adjustNorthUp } =
  initCesium();
const { data, initEvent, reDraw } = useDrawAndGetData(viewer);
// const { drawArea, drawPoint, drawLine } = useDraw(viewer);

const emits = defineEmits(["save"]);

const zoom = (type: "zoomIn" | "zoomOut") => {
  zoomFn(type, 200);
};
const fullScreen = () => {
  // 是否已经进入全屏
  var isFull = document.fullscreenElement;
  if (isFull) {
    document.exitFullscreen();
  } else {
    const element = document.getElementById("cesium-container")!;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  }
};
const toNorth = () => {
  adjustNorthUp();
};
const loadRoadMap = () => {
  loadRoadNetwork();
};
const search = (data: any) => {
  console.log(data);
};
const save = () => {
  emits("save", data.value);
  close();
};

const close = () => {
  destroyed();
  data.value = [];
  state.visible = false;
};

/**
 * @description 编辑的时候 重绘出来
 */
const drawOldGis = (data: CesiumDataItem[]) => {
  const oldData = data.map((item, index) => {
    return {
      degrees: [item.longitude, item.latitude],
      index,
      data: item.flag,
    };
  });
  reDraw(oldData, state.drawType);
};

const open = (type: CesiumDataType, data?: CesiumDataItem[]) => {
  state.drawType = type;
  state.visible = true;
  nextTick(() => {
    // 初始化cesium
    init();
    viewer = shallowRef(viewer.value);
    // 初始化鼠标一些事件
    initEvent(state.drawType);
    // 编辑重绘
    if (data && viewer.value) {
      drawOldGis(data);
    }
  });
};

defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
#cesium {
  height: calc(100vh - 54px);
}
#cesium-container {
  position: relative;
  overflow: hidden;
  .save {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 10px;
  }
  .filter {
    position: absolute;
    left: 10px;
    top: 10px;
  }
  .search {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 10px;
  }
  .shortcut-keys {
    position: absolute;
    right: 10px;
    top: 10px;
  }
}
.shortcut-keys {
  .el-button {
    background-color: rgba(27, 27, 27, 0.8);
    border-color: var(--el-color-primary);
    color: #fff;
  }
}
:deep(.el-popper) {
  background-color: rgba(27, 27, 27, 0.8);
  border-color: var(--el-color-primary);
  color: #fff;
  .el-select-dropdown__item {
    color: #fff;
  }
  .el-select-dropdown__item.is-hovering {
    background-color: rgba(63, 63, 63, 0.7);
  }
  .el-popper__arrow::before {
    background-color: rgba(63, 63, 63, 0.7);
    border-color: var(--el-color-primary);
  }
  .el-checkbox {
    color: #fff;
  }
}
</style>
