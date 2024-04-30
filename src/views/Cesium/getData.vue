<template>
  <div id="cesium-container">
    <div id="cesium"></div>
    <div class="filter">
      <InputSearch :filter="true" @search="search" />
    </div>
    <div class="search">
      <InputSearch @search="search" />
    </div>
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
</template>

<script lang="ts">
export default { name: "Cesium" };
</script>
<script lang="ts" setup>
import { onMounted, reactive, withDefaults } from "vue";
import {
  CesiumDataType,
  CesiumFilterType,
  useDrawAndGetData,
  filterType,
  useDraw,
  initCesium,
} from "./index";
import {
  Search,
  Menu,
  Cpu,
  Compass,
  FullScreen,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
import InputSearch from "@/components/inputSearch.vue";
import * as Cesium from "cesium";

const props = withDefaults(defineProps<{ type: CesiumDataType }>(), {
  type: CesiumDataType.Point,
});
const state = reactive({
  filter: "",
  type: "" as CesiumFilterType,
  search: "",
  radio: "",
  check: [0, 1, 2, 3, 4, 5],
});
const {
  viewer,
  getCartesian3FromDegrees,
  zoomFn,
  adjustNorthUp,
  loadRoadNetwork,
  flyTo,
} = initCesium();
const { data } = useDrawAndGetData(viewer, props.type);
const { drawArea, drawPoint, drawLine } = useDraw(viewer);

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
  // adjustNorthUp();
  flyTo(104.067426, 30.605464);
};
const loadRoadMap = () => {
  loadRoadNetwork();
};
const search = (data: any) => {
  console.log(data);
};
const save = () => {
  console.log(data.value);
};

onMounted(() => {
  const areaData = [
    {
      degrees: [104.04610691746556, 30.56356758492472],
      index: 0,
    },
    {
      degrees: [104.04620116938871, 30.534075690947468],
      index: 1,
    },
    {
      degrees: [104.0693050795226, 30.52568728718801],
      index: 2,
    },
    {
      degrees: [104.06910191282006, 30.568197324242895],
      index: 3,
    },
  ];
  const pointData = [
    {
      degrees: [104.05969835269997, 30.55190206787255],
      index: 0,
    },
    {
      degrees: [104.06105836212794, 30.545671988013375],
      index: 1,
    },
  ];
  const d1 = areaData.map((item) => getCartesian3FromDegrees(item.degrees));
  const d2 = new Cesium.PolygonHierarchy(d1);
  const area = drawArea(d2);
  // const area = drawAreaLine(d1);
  areaData.forEach((item) => {
    const point = getCartesian3FromDegrees(item.degrees);
    drawPoint(point, 10);
  });
  pointData.forEach((item) => {
    const point = getCartesian3FromDegrees(item.degrees);
    drawPoint(point);
  });
});
</script>

<style lang="scss" scoped>
#cesium {
  height: 100vh;
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
