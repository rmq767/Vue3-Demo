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
    :append-to-body="true"
  >
    <div id="cesium-container">
      <div id="cesium"></div>
      <div class="shortcut-keys">
        <el-button-group>
          <el-button title="文字图层控制" :icon="Cpu" @click="loadRoadMap" />
          <el-button title="定位" :icon="Compass" @click="toNorth" />
          <el-button title="放大" :icon="ZoomIn" @click="zoom('zoomIn')" />
          <el-button title="缩小" :icon="ZoomOut" @click="zoom('zoomOut')" />
          <el-button
            title="全屏控制"
            @click="fullScreen"
            :icon="FullScreen"
          ></el-button>
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
import {
  useDrawAndGetData,
  initCesium,
  getCartesian3FromDegrees,
  getCenterPoint,
  useDraw,
} from "./index";
import {
  Cpu,
  Compass,
  ZoomIn,
  ZoomOut,
  FullScreen,
} from "@element-plus/icons-vue";
import {
  CesiumData,
  CesiumDataItem,
  CesiumDataType,
  CesiumFilterType,
  MyConstructorOptions,
} from "@/types/gis";
import { nextTick } from "vue";

const state = reactive({
  filter: "",
  type: undefined as CesiumFilterType | undefined,
  search: "",
  radio: "",
  visible: false,
  drawType: CesiumDataType.Point as CesiumDataType,
  isFull: false,
});
let { viewer, zoomFn, loadRoadNetwork, destroyed, init, adjustNorthUp, flyTo } =
  initCesium();
const { data, initEvent, reDraw, reset } = useDrawAndGetData(viewer);

const emits = defineEmits(["save"]);

const zoom = (type: "zoomIn" | "zoomOut") => {
  zoomFn(type, 200);
};
const fullScreen = () => {
  // 是否已经进入全屏
  var isFull = document.fullscreenElement;
  if (isFull) {
    document.exitFullscreen();
    state.isFull = false;
  } else {
    const element = document.getElementById("cesium-container")!;
    if (element.requestFullscreen) {
      element.requestFullscreen();
      state.isFull = true;
    }
  }
};
const toNorth = () => {
  adjustNorthUp();
};
const loadRoadMap = () => {
  loadRoadNetwork();
};

const save = () => {
  emits("save", data.value);
  close();
};

const close = () => {
  reset();
  destroyed();
  data.value = [];
  state.visible = false;
};

/**
 * @description 编辑的时候 重绘出来
 */
const drawOldGis = (data: CesiumDataItem[]) => {
  if (!data.length) {
    return;
  }
  const oldData = data.map((item, index) => {
    return {
      degrees: [item.lon, item.lat],
      index,
      data: item.flag,
    };
  });
  reDraw(oldData, state.drawType);
  const Cartesian3Arr = data.map((item) =>
    getCartesian3FromDegrees([item.lon, item.lat])
  );
  const [longitude, latitude] = getCenterPoint(Cartesian3Arr);
  flyTo(longitude, latitude);
};

const open = (type: CesiumDataType, data?: CesiumDataItem[]) => {
  state.drawType = type;
  state.visible = true;
  nextTick(() => {
    // 初始化cesium
    init();
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
