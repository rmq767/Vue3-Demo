<template>
  <div class="gis-getdata">
    <div class="handle">
      <el-radio-group v-model="state.drawType">
        <el-radio-button label="画点" :value="CesiumDataType.Point" />
        <el-radio-button label="画线" :value="CesiumDataType.Polyline" />
        <el-radio-button label="画面" :value="CesiumDataType.Polygon" />
      </el-radio-group>
      <el-button type="primary" @click="openGisSign">标点</el-button>
    </div>

    <GisSign ref="gisSignRef" @save="savePointData"></GisSign>
  </div>
</template>

<script lang="ts">
export default { name: "getData" };
</script>
<script lang="ts" setup>
import GisSign from "@/components/Gis/sign.vue";
import { reactive, ref } from "vue";
import { CesiumDataType } from "@/types/gis";

const state = reactive({
  drawType: CesiumDataType.Point as CesiumDataType,
  formData: {
    pointData: [
      // {
      //   longitude: 104.04410117961203,
      //   latitude: 30.542082990470284,
      //   name: "测试1",
      //   id: "1-1-1",
      //   flag: "1",
      //   remark: "备注1",
      // },
      // {
      //   longitude: 104.04403855249438,
      //   latitude: 30.539679599708723,
      //   name: "测试2",
      //   id: "1-1-2",
      //   flag: "2",
      //   remark: "备注2",
      // },
      // {
      //   longitude: 104.04614545132368,
      //   latitude: 30.539697621757444,
      //   name: "测试3",
      //   id: "1-1-3",
      //   flag: "",
      //   remark: "备注3",
      // },
      // {
      //   longitude: 104.04613294234225,
      //   latitude: 30.542067148690677,
      //   name: "测试4",
      //   id: "1-1-4",
      //   flag: "",
      //   remark: "",
      // },
    ],
  },
});

const gisSignRef = ref<InstanceType<typeof GisSign>>();
const openGisSign = () => {
  gisSignRef.value?.open(state.drawType);
};
const savePointData = (data: any) => {
  console.log(data);
  // if (data) {
  //   state.formData.pointData = data.map((item: any) => {
  //     return {
  //       index: item.index + 1,
  //       longitude: item.degrees[0],
  //       latitude: item.degrees[1],
  //     };
  //   });
  // }
};
</script>

<style lang="scss" scoped>
.gis-getdata {
  width: 100%;
  height: 100%;
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
