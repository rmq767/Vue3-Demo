<template>
  <div class="gis-getdata">
    <el-input type="textarea" :rows="30" v-model="state.code"></el-input>
    <div class="handle">
      <el-button type="primary" @click="openGis">渲染数据</el-button>
    </div>
    <DrawGis ref="gisRef"></DrawGis>
  </div>
</template>

<script lang="ts">
export default { name: "getData" };
</script>
<script lang="ts" setup>
import DrawGis from "@/components/Gis/draw.vue";
import { reactive, ref, watch } from "vue";
import { CesiumDataType } from "@/types/gis";

const state = reactive({
  drawType: CesiumDataType.Point as CesiumDataType,
  data: [
    {
      type: 1,
      name: "区块",
      remark: "面",
      pointData: [
        {
          lon: 103.49,
          lat: 31.24,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 103.15,
          lat: 30.48,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 103.9,
          lat: 30.33,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 104.17,
          lat: 30.75,
          name: "",
          remark: "",
          img: "",
        },
      ],
    },
    {
      type: 4,
      name: "管道",
      remark: "线",
      pointData: [
        {
          lon: 103.53,
          lat: 31.02,
          remark: "起点",
          name: "",
          img: "",
        },
        {
          lon: 103.57,
          lat: 31.03,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 103.61,
          lat: 31.0,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 103.64,
          lat: 30.95,
          remark: "终点",
          name: "",
          img: "",
        },
      ],
    },
    {
      type: 3,
      name: "点",
      remark: "点",
      pointData: [
        {
          lon: 104.07,
          lat: 30.63,
          name: "体育馆",
          remark: "四川省体育馆",
          img: "",
        },
      ],
    },
    {
      type: 5,
      name: "图片",
      remark: "图片",
      pointData: [
        {
          lon: 104.06,
          lat: 30.57,
          remark: "环球中心",
          img: "https://picsum.photos/200",
          name: "",
        },
      ],
    },
  ],
  code: "",
});

watch(
  () => state.data,
  (newVal, oldVal) => {
    const jsonString = JSON.stringify(newVal, null, 2);
    state.code = jsonString;
  },
  {
    deep: true,
    immediate: true,
  }
);

const gisRef = ref<InstanceType<typeof DrawGis>>();
const openGis = () => {
  gisRef.value?.open(JSON.parse(state.code));
};
</script>

<style lang="scss" scoped>
.gis-getdata {
  width: 100%;
  height: 100%;
}
.handle {
  display: flex;
  align-items: center;
  justify-content: center;
  .el-button {
    margin-top: 20px;
  }
}
</style>
