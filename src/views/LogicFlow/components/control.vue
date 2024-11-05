<template>
  <div class="control">
    <el-button-group>
      <el-button type="primary" :icon="ZoomIn" title="放大" @click="zoomIn" />
      <el-button type="primary" :icon="ZoomOut" title="缩小" @click="zoomOut" />
      <el-button
        type="primary"
        :icon="FullScreen"
        title="大小适应"
        @click="zoomReset"
      />
      <el-button
        type="primary"
        :icon="Aim"
        title="定位还原"
        @click="translateReset"
      />
      <el-button
        type="primary"
        :icon="Back"
        title="上一步"
        :disabled="undoDisable"
        @click="undo"
      />
      <el-button
        type="primary"
        :icon="Right"
        title="下一步"
        :disabled="redoDisable"
        @click="redo"
      />
    </el-button-group>
  </div>
</template>

<script lang="ts">
export default { name: "Control" };
</script>
<script lang="ts" setup>
import {
  ZoomIn,
  ZoomOut,
  FullScreen,
  Aim,
  Back,
  Right,
} from "@element-plus/icons-vue";
import LogicFlow from "@logicflow/core";
import { onMounted, ref } from "vue";

const props = defineProps<{ lf?: LogicFlow }>();
const undoDisable = ref(true);
const redoDisable = ref(true);

const zoomIn = () => {
  props.lf?.zoom(true);
};

const zoomOut = () => {
  props.lf?.zoom(false);
};

const zoomReset = () => {
  props.lf?.resetZoom();
};

const translateReset = () => {
  props.lf?.translateCenter();
};

const undo = () => {
  props.lf?.undo();
};

const redo = () => {
  props.lf?.redo();
};

onMounted(() => {
  props.lf &&
    props.lf.on("history:change", ({ data }) => {
      undoDisable.value = !data.undoAble;
      redoDisable.value = !data.redoAble;
    });
});
</script>

<style lang="scss" scoped>
.control {
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>
