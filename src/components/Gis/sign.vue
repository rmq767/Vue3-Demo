<template>
  <el-dialog
    title="地图标点"
    v-model="state.visible"
    center
    :fullscreen="true"
    @close="close"
    class="gis-dialog"
    destroy-on-close
    :append-to-body="true"
  >
    <div id="cesium-container">
      <div id="cesium"></div>
      <div class="shortcut-keys">
        <div class="btn-group">
          <el-button title="路网地名" @click="loadRoadNetwork">
            <div class="btn-content">
              <el-icon>
                <Cpu />
              </el-icon>
              <span>路网地名</span>
            </div>
          </el-button>
          <el-button title="正向俯视" @click="adjustNorthUp">
            <div class="btn-content">
              <el-icon>
                <Compass />
              </el-icon>
              <span>正向俯视</span>
            </div>
          </el-button>
          <el-button title="全屏控制" @click="fullScreen">
            <div class="btn-content">
              <el-icon>
                <FullScreen />
              </el-icon>
              <span>{{ state.isFull ? "退出全屏" : "全屏" }}</span>
            </div>
          </el-button>
          <Zoom @zoom="zoomFn" class="zoom-control"></Zoom>
        </div>
      </div>
      <el-button type="primary" class="save" @click="save">保存</el-button>
    </div>
    <CameraControl
      class="camera-control"
      @move-camera="moveCamera"
      @mouse-down="onMousedown"
    ></CameraControl>
    <LengendDialog ref="lengendDialogRef"></LengendDialog>
  </el-dialog>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import { reactive, ref } from "vue";
import {
  useDrawAndGetData,
  initCesium,
  getCartesian3FromDegrees,
  getCenterPoint,
  useDraw,
  getLongestDistance,
} from "./index";
import { Cpu, Compass, FullScreen } from "@element-plus/icons-vue";
import { CesiumDataItem, CesiumDataType, CesiumFilterType } from "@/types/gis";
import { nextTick } from "vue";
import CameraControl from "./components/cameraControl.vue";
import * as Cesium from "cesium";
import Zoom from "./components/zoom.vue";

const state = reactive({
  checked: ["1", "2", "3", "4", "5", "直井", "水平井", "定向井"],
  visible: false,
  drawType: CesiumDataType.Point as CesiumDataType,
  isFull: false,
  filterType: undefined as CesiumFilterType | undefined,
  filterName: "" as string | undefined,
  filterId: "" as string | undefined,
});
const editType = ref<CesiumFilterType>();
let {
  viewer,
  zoomFn,
  loadRoadNetwork,
  destroyed,
  init,
  adjustNorthUp,
  flyTo,
  orbitTickFunction,
  getFrame,
} = initCesium();
const { data, initEvent, reDraw, reset, removeStaticEntites } =
  useDrawAndGetData(viewer, editType);
const { drawMapByData } = useDraw(viewer);
const emits = defineEmits(["save"]);

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
/**
 * @description 调整视角方向
 */
const onMousedown = () => {
  getFrame();
};
const moveCamera = (type: string) => {
  const pitch =
    viewer.value?.camera.pitch || Number((-Cesium.Math.PI / 2).toFixed(15));
  switch (type) {
    case "top":
      if (pitch <= Cesium.Math.toRadians(-10)) {
        orbitTickFunction(0, 0.01);
      }
      break;
    case "bottom":
      if (pitch > Cesium.Math.toRadians(-90)) {
        orbitTickFunction(0, -0.01);
      }
      break;
    case "left":
      orbitTickFunction(0.01, 0);
      break;
    case "right":
      orbitTickFunction(-0.01, 0);
      break;
  }
};
// /**
//  * @description 根据搜索数据画图
//  */
// const drawMap = (data: CesiumData[], fly: boolean) => {
//   const allPoint = drawMapByData(data);
//   filterDraw();
//   if (fly && allPoint.length) {
//     const [longitude, latitude] = getCenterPoint(allPoint);
//     const { maxDistance } = getLongestDistance(allPoint);
//     // 飞到指定高度
//     const height = Math.round(maxDistance) * 1.5;
//     flyTo(longitude, latitude, height);
//   }
// };
// /**
//  * @description 切换标签或隐藏 线的动画执行会出现问题 需要重新加载
//  */
// const visibleWindow = () => {
//   drawMap(drawData.value, false);
// };
// const hiddenWindow = () => {
//   viewer.value?.entities.removeAll();
// };
// /**
//  * @description 每次重画 都要筛一下
//  */
// const filterDraw = () => {
//   // 选择展示类型
//   const entities = viewer.value?.entities.values;
//   entities?.forEach((item: MyConstructorOptions) => {
//     // 排除搜索画出来的图
//     if (item.isStatic) {
//       if (item.type === CesiumFilterType.Well) {
//         // 井
//         if (state.checked.includes(item.wellType!)) {
//           item.show = true;
//         } else {
//           item.show = false;
//         }
//       } else {
//         if (state.checked.includes(String(item.type!))) {
//           item.show = true;
//         } else {
//           item.show = false;
//         }
//       }
//     }
//   });
//   // 重新渲染
//   viewer.value?.scene.requestRender();
// };

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
  const { maxDistance } = getLongestDistance(Cartesian3Arr);
  flyTo(longitude, latitude, maxDistance);
};

const open = (
  type: CesiumDataType,
  data: CesiumDataItem[],
  other?: {
    filterType?: CesiumFilterType;
    filterId?: string;
    filterName?: string;
    editType?: CesiumFilterType;
  }
) => {
  state.drawType = type;
  editType.value = other?.editType;

  state.filterType = other?.filterType;
  state.filterId = other?.filterId;
  state.filterName = other?.filterName;

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
    bottom: 40px;
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
    background-color: rgba(27, 27, 27, 0.8);
    border-color: var(--el-color-primary);
  }
  .el-checkbox {
    color: #fff;
  }
  .el-tree {
    background: transparent;
    color: #fff;
  }
  .el-tree-node__content:hover {
    background-color: rgba(63, 63, 63, 0.7);
  }
  .el-tree-node:focus > .el-tree-node__content {
    background-color: rgba(63, 63, 63, 0.7);
  }
}
.btn-group {
  display: flex;
  flex-direction: column;
  .el-button + .el-button {
    margin-left: 0;
  }
  .el-button {
    border-radius: 0;
    height: 100%;
    padding: 4px;
    &:first-of-type {
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }
    &:last-of-type {
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
  .btn-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    svg {
      font-size: 16px;
    }
    .el-icon {
      font-size: 16px;
    }
    span {
      margin-top: 4px;
    }
  }
}
.camera-control {
  position: absolute;
  right: 47px;
  bottom: 185px;
}
.zoom-control {
  position: absolute;
  right: 0px;
  bottom: -20%;
}
</style>
