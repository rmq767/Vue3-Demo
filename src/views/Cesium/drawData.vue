<template>
  <div class="gis-getdata">
    <div class="code">{{ state.code }}</div>
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
      remark: "测试1",
      pointData: [
        {
          lon: 103.94,
          lat: 30.75,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 104.03,
          lat: 30.57,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 104.14,
          lat: 30.57,
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
      remark: "测试2",
      pointData: [
        {
          lon: 104.07,
          lat: 30.61,
          remark: "起点",
          name: "",
          img: "",
        },
        {
          lon: 104.03,
          lat: 30.59,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 104.01,
          lat: 30.55,
          name: "",
          remark: "",
          img: "",
        },
        {
          lon: 103.97,
          lat: 30.5,
          remark: "终点",
          name: "",
          img: "",
        },
      ],
    },
    {
      type: 3,
      name: "点",
      remark: "测试3",
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
      remark: "测试4",
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
    const jsonString = JSON.stringify(newVal);
    state.code = jsonString;
  },
  {
    deep: true,
    immediate: true,
  }
);

const gisRef = ref<InstanceType<typeof DrawGis>>();
const openGis = () => {
  gisRef.value?.open(state.data);
};
</script>

<style lang="scss" scoped>
.gis-getdata {
  width: 100%;
  // height: 100%;
  .code {
    min-height: 30vh;
    width: 80%;
    margin: 20px auto;
  }
}
.handle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  .el-button {
    margin-top: 20px;
  }
}
</style>
