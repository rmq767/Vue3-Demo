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
        tvd: 704.71971399,
        md: 705.19158862,
      },
      {
        tvd: 712.21260794,
        md: 712.69550549,
      },
      {
        tvd: 719.70598198,
        md: 720.19942237,
      },
      {
        tvd: 724.70174657,
        md: 725.20154586,
      },
      {
        tvd: 729.69847917,
        md: 730.20366935,
      },
      {
        tvd: 734.69540074,
        md: 735.2049105,
      },
    ],
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
        tvd: 904.10752857,
        md: 905.50454002,
      },
      {
        tvd: 909.04896969,
        md: 910.53350887,
      },
      {
        tvd: 913.98926376,
        md: 915.56453719,
      },
      {
        tvd: 918.92614252,
        md: 920.59556552,
      },
      {
        tvd: 923.86256816,
        md: 925.62913325,
      },
      {
        tvd: 928.79652958,
        md: 930.66270097,
      },

      {
        tvd: 933.73007107,
        md: 935.69702082,
      },
      {
        tvd: 938.66371987,
        md: 940.73134067,
      },
      {
        tvd: 943.59696517,
        md: 945.76477013,
      },
      {
        tvd: 948.53098539,
        md: 950.79819959,
      },
    ],
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
        tvd: 2003.9218768,
        md: 2087.6373096,
      },
      {
        tvd: 2008.5435327,
        md: 2092.8224187,
      },
      {
        tvd: 2013.1577016,
        md: 2098.0075277,
      },
      {
        tvd: 2017.7694714,
        md: 2103.1966579,
      },
      {
        tvd: 2022.3767985,
        md: 2108.3857881,
      },
      {
        tvd: 2026.9819368,
        md: 2113.5766273,
      },
      {
        tvd: 2031.5840867,
        md: 2118.7674665,
      },
      {
        tvd: 2036.1845679,
        md: 2123.9603493,
      },
    ],
  },
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
    const { well, imageGroup } = drawWell(item, index, item.length!);
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
