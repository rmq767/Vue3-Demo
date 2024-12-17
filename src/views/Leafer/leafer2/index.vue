<template>
  <div class="leafer-container">
    <div id="leafer" style="width: 100%; height: 100vh"></div>
    <Leaflet :data="data" class="leaflet" @get-points="getPoints"></Leaflet>
  </div>
</template>

<script lang="ts">
export default { name: "Leafer" };
</script>
<script lang="ts" setup>
import { Leafer, RenderEvent } from "leafer-ui";
import { Ref, shallowRef, ShallowRef } from "vue";
import Leaflet from "../components/leaflet2.vue";
import { CesiumData } from "@/types/gis";
import { drawLeft, drawLink, drawRight, drawWell, setConfig } from "./index";

const data = [
  // {
  //   name: "井0706002",
  //   businessId: "1676779130877161474",
  //   type: 3,
  //   wellType: "定向井",
  //   pointData: [
  //     {
  //       lon: 103.987124,
  //       lat: 30.598889,
  //       remark: "",
  //     },
  //   ],
  //   info: [
  //     {
  //       type: "地层1",
  //       start: 0,
  //       end: 2000,
  //     },
  //     {
  //       type: "地层2",
  //       start: 2000,
  //       end: 4000,
  //     },
  //     {
  //       type: "地层3",
  //       start: 4000,
  //       end: 5000,
  //     },
  //   ],
  //   length: 5000,
  // },
  // {
  //   name: "井1",
  //   businessId: "1679789842331381761",
  //   type: 3,
  //   wellType: "直井",
  //   pointData: [
  //     {
  //       lon: 105.06149,
  //       lat: 31.570505,
  //       remark: "33",
  //     },
  //   ],
  //   info: [
  //     {
  //       type: "地层1",
  //       start: 0,
  //       end: 2000,
  //     },
  //     {
  //       type: "地层1-1",
  //       start: 2000,
  //       end: 3000,
  //     },
  //     {
  //       type: "地层2",
  //       start: 3000,
  //       end: 6000,
  //     },
  //     {
  //       type: "地层3",
  //       start: 6000,
  //       end: 8000,
  //     },
  //   ],
  //   length: 8000,
  // },
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
        type: "start",
        start: 0,
        end: 0,
        coordinate: [102.24508, 32.923487],
      },
      {
        type: "地层1",
        start: 0,
        end: 2000,
        coordinate: [102.24008, 32.923487],
      },
      {
        type: "地层1-1",
        start: 2000,
        end: 3000,
        coordinate: [102.236319, 32.923487],
      },
      {
        type: "地层2",
        start: 3000,
        end: 6000,
        coordinate: [102.221319, 32.923487],
      },
      {
        type: "地层3",
        start: 6000,
        end: 7000,
        coordinate: [102.211319, 32.923487],
      },
    ],
    length: 7000,
  },
  // {
  //   name: "20242",
  //   businessId: "1840656103032012802",
  //   type: 3,
  //   wellType: "直井",
  //   pointData: [
  //     {
  //       lon: 108.646241,
  //       lat: 27.995644,
  //       remark: "",
  //     },
  //   ],
  //   info: [
  //     {
  //       type: "地层1",
  //       start: 0,
  //       end: 2000,
  //     },
  //     {
  //       type: "地层1-1",
  //       start: 2000,
  //       end: 3000,
  //     },
  //     {
  //       type: "地层2",
  //       start: 3000,
  //       end: 6000,
  //     },
  //     {
  //       type: "地层3",
  //       start: 6000,
  //       end: 9000,
  //     },
  //   ],
  //   length: 9000,
  // },
] as CesiumData[];
const leafer = shallowRef<Leafer>();

const getPoints = (data: ShallowRef<CesiumData[]>, lineLength: Ref<number>) => {
  if (leafer.value) {
    leafer.value.removeAll();
  }
  initCanvas(data, lineLength);
  console.log(data.value, lineLength.value);
};

const initCanvas = (
  data: ShallowRef<CesiumData[]>,
  lineLength: Ref<number>
) => {
  if (leafer.value) {
    leafer.value.clear();
  } else {
    leafer.value = new Leafer({
      view: "leafer",
      wheel: {
        disabled: true,
      },
      move: {
        drag: false,
        scroll: false,
      },
    });
  }
  setConfig(leafer, data, lineLength);
  if (data.value.length === 1) {
    const left = drawLeft(data.value[0]);
    leafer.value.add(left);
    const right = drawRight(data.value[0]);
    leafer.value.add(right);
    const well = drawWell(data.value[0], 0);
    leafer.value.add(well);
  }
};
</script>

<style lang="scss" scoped>
.leafer-container {
  width: 100%;
  height: 100%;
  position: relative;
  .leaflet {
    position: absolute;
    bottom: 0;
    left: 0;
  }
  #leafer,
  #target {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
  }
}
</style>
