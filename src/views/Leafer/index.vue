<template>
  <div class="leafer-container">
    <div id="leafer" style="width: 100%; height: 100vh"></div>
    <GIS :data="data" class="gis"></GIS>
    <Leaflet :data="data" class="leaflet" @get-points="getPoints"></Leaflet>
  </div>
</template>

<script lang="ts">
export default { name: "Leafer" };
</script>
<script lang="ts" setup>
import { Leafer } from "leafer-ui";
import { Ref, shallowRef, ShallowRef } from "vue";
import GIS from "./components/gis.vue";
import Leaflet from "./components/leaflet.vue";
import { CesiumData } from "@/types/gis";
import { drawLeft, drawLink, drawRight, drawWell, setConfig } from ".";

const data = [
  {
    name: "井0706002",
    businessId: "1676779130877161474",
    type: 3,
    wellType: "定向井",
    pointData: [
      {
        lon: 103.987124,
        lat: 30.598889,
        remark: "",
      },
    ],
    info: [
      {
        type: "地层1",
        start: 0,
        end: 2000,
      },
      {
        type: "地层2",
        start: 2000,
        end: 4000,
      },
      {
        type: "地层3",
        start: 4000,
        end: 5000,
      },
    ],
    length: 5000,
  },
  {
    name: "井1",
    businessId: "1679789842331381761",
    type: 3,
    wellType: "直井",
    pointData: [
      {
        lon: 105.06149,
        lat: 31.570505,
        remark: "33",
      },
    ],
    info: [
      {
        type: "地层1",
        start: 0,
        end: 2000,
      },
      {
        type: "地层1-1",
        start: 2000,
        end: 3000,
      },
      {
        type: "地层2",
        start: 3000,
        end: 6000,
      },
      {
        type: "地层3",
        start: 6000,
        end: 8000,
      },
    ],
    length: 8000,
  },
  {
    name: "宁209H13-9",
    businessId: "1680792663432409090",
    type: 3,
    wellType: "水平井",
    pointData: [
      {
        lon: 102.24508,
        lat: 32.923487,
        remark: "测试（HX）",
      },
    ],
    info: [
      {
        type: "地层1",
        start: 0,
        end: 2000,
      },
      {
        type: "地层1-1",
        start: 2000,
        end: 3000,
      },
      {
        type: "地层2",
        start: 3000,
        end: 6000,
      },
      {
        type: "地层3",
        start: 6000,
        end: 7000,
      },
    ],
    length: 7000,
  },
  {
    name: "20242",
    businessId: "1840656103032012802",
    type: 3,
    wellType: "直井",
    pointData: [
      {
        lon: 108.646241,
        lat: 27.995644,
        remark: "",
      },
    ],
    info: [
      {
        type: "地层1",
        start: 0,
        end: 2000,
      },
      {
        type: "地层1-1",
        start: 2000,
        end: 3000,
      },
      {
        type: "地层2",
        start: 3000,
        end: 6000,
      },
      {
        type: "地层3",
        start: 6000,
        end: 9000,
      },
    ],
    length: 9000,
  },
] as CesiumData[];
const leafer = shallowRef<Leafer>();

const getPoints = (data: ShallowRef<CesiumData[]>, lineLength: Ref<number>) => {
  if (leafer.value) {
    leafer.value.removeAll();
  }
  console.log(data.value);
  initCanvas(data, lineLength);
};

const initCanvas = (
  data: ShallowRef<CesiumData[]>,
  lineLength: Ref<number>
) => {
  leafer.value = new Leafer({
    view: "leafer",
    wheel: {
      disabled: true,
    },
    zoom: { min: 0.02, max: 256 },
    move: {
      drag: false,
      scroll: false,
    },
  });
  if (data.value.length === 0) {
    return;
  }
  // 设置配置，否则无法画图
  setConfig(leafer, data, lineLength);
  if (data.value.length === 1) {
    debugger;
    // 单井
    const element = data.value[0];
    // 画井
    const well = drawWell(element, 0);
    leafer.value.add(well);
    // 画左边地层
    if (element.distance !== 0) {
      const rectArr = drawLeft(element);
      leafer.value.add(rectArr);
    }
    // 画右边地层
    if (element.distance !== lineLength.value) {
      const rectArr = drawRight(element, 0);
      leafer.value.add(rectArr);
    }
  } else {
    // 多井
    for (let i = 0; i < data.value.length; i++) {
      const element = data.value[i];
      // 画井
      const well = drawWell(element, i);
      leafer.value.add(well);
      if (i === 0) {
        // 左边有空隙 画左边地层
        if (element.distance !== 0) {
          const rectArr = drawLeft(element);
          leafer.value.add(rectArr);
        }
      } else {
        // 画连接地层
        const { bg, polygonArr } = drawLink(
          data.value[i - 1],
          i - 1,
          element,
          i
        );
        leafer.value.add(bg);
        leafer.value.add(polygonArr);
      }
      // 右边有空隙 画右边地层
      if (i === data.value.length - 1) {
        if (element.distance !== lineLength.value) {
          const rectArr = drawRight(element, i);
          leafer.value.add(rectArr);
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.leafer-container {
  width: 100%;
  height: 100%;
  position: relative;
  .gis,
  .leaflet {
    position: absolute;
    bottom: 0;
    left: 0;
  }
}
</style>
