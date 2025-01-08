<template>
  <div class="logic-flow-container">
    <div class="logic-flow-header">
      <el-button type="primary" @click="getData">获取数据</el-button>
      <el-button type="primary" @click="submit">提交</el-button>
    </div>
    <div class="logic-flow-main">
      <div class="logic-flow" ref="logicFlowRef"></div>
      <Setting
        class="logic-flow-setting"
        :data="nodeData!"
        :lf="lf"
        :type="settingType"
      ></Setting>
      <NodePanel :lf="lf"></NodePanel>
    </div>
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
import { registeNode, registerKeyboard, requiredConfig } from "./index";
import { ElMessage } from "element-plus";
import Control from "./components/control.vue";
import Setting from "./components/setting.vue";
import { SettingType } from "@/types/logic-flow";

const logicFlowRef = ref<HTMLDivElement>();
const nodeData = ref<LogicFlow.NodeData | LogicFlow.EdgeData>(); // 节点数据
// const state = reactive({
//   settingType: "all" as SettingType,
// });
const settingType = ref<SettingType>("all");
const lf = shallowRef<LogicFlow>();

const getSettingInfo = (data: LogicFlow.NodeData | LogicFlow.EdgeData) => {
  switch (data.type) {
    case "launch":
      nodeData.value = data;
      settingType.value = data.type;
      break;
    case "approver":
      nodeData.value = data;
      settingType.value = data.type;
      break;
    case "link":
      nodeData.value = data;
      settingType.value = data.type;
      break;
    case "review":
      nodeData.value = data;
      settingType.value = data.type;
      break;
    case "polyline":
    case "dashedLine":
      nodeData.value = data;
      settingType.value = data.type;
      break;
  }
};
/**
 * @description 注册事件
 */
const initEvent = (lf: ShallowRef<LogicFlow | undefined>) => {
  lf.value?.on("blank:click", (e) => {
    settingType.value = "all";
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
/**
 * @description 获取数据
 */
const getData = () => {
  console.log(lf.value?.getGraphData());
};
/**
 * @description 提交 验证数据
 */
const submit = () => {
  const { nodes } = lf.value?.getGraphData() as LogicFlow.GraphData;
  for (let index = 0; index < nodes.length; index++) {
    const data = nodes[index];
    const { properties } = data;
    // 循环配置项
    for (const key in properties) {
      // 数组配置项 判断是否为空
      if (Array.isArray(properties[key])) {
        if (requiredConfig[key] && properties[key].length === 0) {
          return ElMessage.error(
            `${data.text?.value}节点 ${requiredConfig[key]}`
          );
        }
      } else {
        // 非数组配置项 判断是否为空
        if (requiredConfig[key] && !properties[key]) {
          return ElMessage.error(
            `${data.text?.value}节点 ${requiredConfig[key]}`
          );
        }
      }
    }
  }
  console.log(lf.value?.getGraphData());
};

onMounted(() => {
  lf.value = new LogicFlow({
    container: logicFlowRef.value!,
    grid: true,
    keyboard: {
      enabled: true,
      shortcuts: registerKeyboard(lf, nodeData, settingType),
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
  .logic-flow-header {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-bottom: 1px solid #ccc;
    padding: 0 20px;
  }
  .logic-flow-main {
    display: flex;
    width: 100%;
    height: calc(100% - 54px);
    position: relative;
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
