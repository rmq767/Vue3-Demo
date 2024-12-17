<template>
  <div class="leafer-container">
    <div id="leafer" style="width: 100%; height: 100vh"></div>
    <Leaflet :data="data" class="leaflet" @checked="checked"></Leaflet>
  </div>
</template>

<script lang="ts">
export default { name: "Leafer3" };
</script>
<script lang="ts" setup>
import { CesiumData } from "@/types/gis";
import Leaflet from "../components/leaflet3.vue";
import { ShallowRef, shallowRef } from "vue";
import { Leafer } from "leafer-ui";
import { drawBackground, drawTopBackground, drawWell, setConfig } from ".";

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
        tvd: 30.03,
        md: 30.03,
      },
      {
        tvd: 35.030191279,
        md: 35.030292058,
      },
      {
        tvd: 40.029777904,
        md: 40.030584115,
      },
      {
        tvd: 45.028895243,
        md: 45.03112517,
      },
      {
        tvd: 50.027478202,
        md: 50.031666225,
      },
      {
        tvd: 55.025946247,
        md: 55.03268675,
      },
    ],
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
        tvd: 30.03,
        md: 30.03,
      },
      {
        tvd: 35.030191279,
        md: 35.030292058,
      },
      {
        tvd: 40.029777904,
        md: 40.030584115,
      },
      {
        tvd: 45.028895243,
        md: 45.03112517,
      },
      {
        tvd: 50.027478202,
        md: 50.031666225,
      },
      {
        tvd: 55.025946247,
        md: 55.03268675,
      },
    ],
  },
  // {
  //   name: "宁209H13-9",
  //   businessId: "1680792663432409090",
  //   type: 3,
  //   wellType: "水平井",
  //   pointData: [
  //     {
  //       lon: 102.24508,
  //       lat: 32.923487,
  //       remark: "测试（HX）",
  //     },
  //   ],
  //   info: [
  //     {
  //       type: "start",
  //       start: 0,
  //       end: 0,
  //       coordinate: [102.24508, 32.923487],
  //     },
  //     {
  //       type: "地层1",
  //       start: 0,
  //       end: 2000,
  //       coordinate: [102.24008, 32.923487],
  //     },
  //     {
  //       type: "地层1-1",
  //       start: 2000,
  //       end: 3000,
  //       coordinate: [102.236319, 32.923487],
  //     },
  //     {
  //       type: "地层2",
  //       start: 3000,
  //       end: 6000,
  //       coordinate: [102.221319, 32.923487],
  //     },
  //     {
  //       type: "地层3",
  //       start: 6000,
  //       end: 7000,
  //       coordinate: [102.211319, 32.923487],
  //     },
  //   ],
  //   length: 7000,
  // },
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

const checked = (data: CesiumData[]) => {
  if (data.length) {
    initCanvas(data);
  }
};

const initCanvas = (data: CesiumData[]) => {
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
  setConfig(leafer, data);
  const topBg = drawTopBackground();
  leafer.value.add(topBg);
  const bg = drawBackground();
  leafer.value.add(bg);
  data.forEach((item, index) => {
    const { well, imageGroup } = drawWell(item, index);
    leafer.value?.add(well);
    leafer.value?.add(imageGroup);
  });
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
