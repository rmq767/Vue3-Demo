<template>
  <div class="logic-flow-container">
    <div class="logic-flow-main">
      <div class="logic-flow" ref="logicFlowRef"></div>
      <Setting
        class="logic-flow-setting"
        :data="nodeData!"
        :lf="lf"
        :type="state.settingType"
      ></Setting>
    </div>
    <NodePanel :lf="lf"></NodePanel>
    <!-- 当lf有值 才能注册事件 -->
    <Control v-if="lf" :lf="lf"></Control>
  </div>
</template>

<script lang="ts">
export default { name: "LogicFlow" };
</script>
<script lang="ts" setup>
import LogicFlow from "@logicflow/core";
import "@logicflow/core/lib/style/index.css";
import "@logicflow/extension/lib/style/index.css";
import { onMounted, reactive, ref, ShallowRef, shallowRef } from "vue";
import NodePanel from "./components/node-panel.vue";
import { registeNode, registerKeyboard } from "./index";
import { ElMessage } from "element-plus";
import Control from "./components/control.vue";
import Setting from "./components/setting.vue";
import { SettingType } from "@/types/logic-flow";

const logicFlowRef = ref<HTMLDivElement>();
const nodeData = ref<LogicFlow.NodeData | LogicFlow.EdgeData>(); // 节点数据
const state = reactive({
  settingType: "all" as SettingType,
});
const lf = shallowRef<LogicFlow>();

const getSettingInfo = (data: LogicFlow.NodeData | LogicFlow.EdgeData) => {
  switch (data.type) {
    case "launch":
      nodeData.value = data;
      state.settingType = data.type;
      break;
    case "approver":
      nodeData.value = data;
      state.settingType = data.type;
      break;
    case "link":
      nodeData.value = data;
      state.settingType = data.type;
      break;
    case "review":
      nodeData.value = data;
      state.settingType = data.type;
      break;
    case "polyline":
    case "dashedLine":
      nodeData.value = data;
      state.settingType = data.type;
      break;
  }
};
/**
 * @description 注册事件
 */
const initEvent = (lf: ShallowRef<LogicFlow | undefined>) => {
  lf.value?.on("blank:click", (e) => {
    state.settingType = "all";
  });
  lf.value?.on("node:mousedown", ({ data }) => {
    lf.value?.selectElementById(data.id, false);
    getSettingInfo(data);
  });
  lf.value?.on("edge:click", ({ data }) => {
    lf.value?.selectElementById(data.id, false);
    getSettingInfo(data);
  });
  lf.value?.on("connection:not-allowed", (data) => {
    ElMessage.error(data.msg);
    return false;
  });
  lf.value?.on("node:dnd-add", ({ data }) => {
    // 选中节点 更改信息
    lf.value?.selectElementById(data.id, false);
    getSettingInfo(data);
    lf.value?.container.focus(); // 聚焦 能够使用键盘操作
  });
};

onMounted(() => {
  lf.value = new LogicFlow({
    container: logicFlowRef.value!,
    grid: true,
    keyboard: {
      enabled: true,
      shortcuts: registerKeyboard(lf, nodeData),
    },
    textEdit: false,
  });
  registeNode(lf);
  initEvent(lf);
  lf.value.render({
    nodes: [
      {
        id: "node_1",
        type: "start",
        x: 100,
        y: 300,
        properties: {
          width: 60,
          height: 60,
        },
        text: {
          x: 100,
          y: 300,
          value: "开始",
        },
      },
      {
        id: "node_2",
        type: "launch",
        x: 100,
        y: 400,
        properties: {
          width: 120,
          height: 50,
        },
        text: {
          x: 100,
          y: 400,
          value: "发起流程",
        },
      },
      {
        id: "node_3",
        type: "end",
        x: 100,
        y: 600,
        properties: {
          width: 60,
          height: 60,
        },
        text: {
          x: 100,
          y: 600,
          value: "结束",
        },
      },
    ],
    edges: [
      {
        id: "edge_1",
        type: "startPolyline",
        sourceNodeId: "node_1",
        targetNodeId: "node_2",
      },
      {
        id: "edge_2",
        type: "polyline",
        sourceNodeId: "node_2",
        targetNodeId: "node_3",
      },
    ],
  });
  lf.value.translateCenter(); // 将图形移动到画布中央
});
</script>

<style lang="scss" scoped>
.logic-flow-container {
  width: 100%;
  height: 100%;
  .logic-flow-main {
    display: flex;
    width: 100%;
    height: 100%;
    .logic-flow-setting {
      flex-basis: 400px;
      flex-shrink: 0;
      border-left: 1px solid #ccc;
    }
    .logic-flow {
      position: relative;
      flex: 1;
      height: 100%;
    }
  }
}
</style>
