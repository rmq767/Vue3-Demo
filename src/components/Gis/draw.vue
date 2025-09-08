<template>
  <el-dialog
    title="只读渲染"
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
    </div>
    <CameraControl
      class="camera-control"
      @move-camera="moveCamera"
      @mouse-down="onMousedown"
    ></CameraControl>
  </el-dialog>
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import { reactive, ref } from "vue";
import {
  initCesium,
  getCartesian3FromDegrees,
  getCenterPoint,
  useDraw,
  getLongestDistance,
} from "./index";
import { Cpu, Compass, FullScreen } from "@element-plus/icons-vue";
import { CesiumData, CesiumFilterType, PolygonType } from "@/types/gis";
import { nextTick } from "vue";
import CameraControl from "./components/cameraControl.vue";
import * as Cesium from "cesium";
import Zoom from "./components/zoom.vue";

const state = reactive({
  visible: false,
  isFull: false,
});
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
const { drawArea, drawLine, drawPoint, initHoverEvent } = useDraw(viewer);

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

const close = () => {
  destroyed();
  state.visible = false;
};

/**
 * @description 编辑的时候 重绘出来
 */
const drawGis = (data: CesiumData[]) => {
  let allPoints: Cesium.Cartesian3[] = [];
  data.forEach((item) => {
    const position = item.pointData.map((point) => {
      return getCartesian3FromDegrees([point.lon, point.lat]);
    });
    allPoints.push(...position);

    if (item.type === CesiumFilterType.Block) {
      // 渲染面
      drawArea(position, PolygonType.Area, {
        properties: item,
      });
    } else if (item.type === CesiumFilterType.Pipeline) {
      // 自定义渲染线上的点
      drawLine(position, {
        properties: item,
        showPoint: false,
      });
      item.pointData.forEach((point) => {
        drawPoint(getCartesian3FromDegrees([point.lon, point.lat]), {
          properties: point,
          point: {
            color: Cesium.Color.BLUE,
          },
          label: {
            text: point.remark,
          },
        });
      });
    } else if (item.type === CesiumFilterType.Well) {
      // 普通点
      drawPoint(position[0], {
        properties: item,
      });
    } else if (item.type === CesiumFilterType.Device) {
      // 图片点
      drawPoint(position[0], {
        properties: item,
        img: item.pointData[0].img,
        billboard: {
          width: 50,
          height: 50,
        },
      });
    }
  });

  const [longitude, latitude] = getCenterPoint(allPoints);
  const { maxDistance } = getLongestDistance(allPoints);
  flyTo(longitude, latitude, maxDistance);
};

const open = (data: CesiumData[]) => {
  state.visible = true;
  nextTick(() => {
    // 初始化cesium
    init();
    initHoverEvent();
    // 画图
    drawGis(data);
  });
};

defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
#cesium {
  height: calc(100vh - 75px);
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
