<template>
  <div class="gis-getdata">
    <div class="code">{{ state.code }}</div>
    <div class="handle">
      <el-radio-group v-model="state.drawType" @change="changeType">
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
import { reactive, ref, watch } from "vue";
import { CesiumDataType, CesiumDataItem, CesiumDrawGetData } from "@/types/gis";

const state = reactive({
  drawType: CesiumDataType.Point as CesiumDataType,
  formData: {
    pointData: [] as CesiumDataItem[],
  },
  code: "",
});

watch(
  () => state.formData.pointData,
  (newVal, oldVal) => {
    const jsonString = JSON.stringify(newVal);
    state.code = jsonString;
  },
  {
    deep: true,
    immediate: true,
  }
);

const gisSignRef = ref<InstanceType<typeof GisSign>>();
const openGisSign = () => {
  gisSignRef.value?.open(state.drawType, state.formData.pointData);
};
const savePointData = (data: CesiumDrawGetData[]) => {
  if (data) {
    state.formData.pointData = data.map((item) => {
      return {
        lon: item.degrees[0],
        lat: item.degrees[1],
      };
    });
  }
};
const changeType = () => {
  state.formData.pointData = [];
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
