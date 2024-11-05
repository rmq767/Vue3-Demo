<template>
  <div class="node-panel">
    <div
      v-for="(item, key) in state.nodePanel"
      :key="key"
      class="approve-node"
      @mousedown="dragNode(item)"
    >
      <div class="node-shape" :class="'node-' + item.type"></div>
      <div class="node-label">{{ item.text }}</div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "NodePanel" };
</script>
<script lang="ts" setup>
import { ILogicFlowNodePanelItem } from "@/types/logic-flow";
import LogicFlow from "@logicflow/core";
import { reactive } from "vue";
const props = defineProps<{ lf?: LogicFlow }>();
const state = reactive({
  nodePanel: [
    {
      type: "approver",
      text: "用户活动",
    },
    {
      type: "link",
      text: "连接点",
    },
    {
      type: "review",
      text: "传阅",
    },
  ],
});
const dragNode = (item: ILogicFlowNodePanelItem) => {
  props.lf?.dnd.startDrag({
    type: item.type,
    text: item.text,
  });
};
</script>

<style lang="scss" scoped>
.node-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 0 10px 1px #e4e0db;
  border-radius: 6px;
  text-align: center;
  z-index: 101;
  .approve-node {
    cursor: pointer;
    user-select: none;
    position: relative;
    padding: 10px 0;
    .node-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
    }
  }
  .node-shape {
    box-sizing: border-box;
    &.node-approver {
      width: 120px;
      height: 50px;
      border-radius: 4px;
      border: 2px solid #facd91;
      background-color: #facd91;
    }
    &.node-link {
      width: 120px;
      height: 50px;
      border-radius: 4px;
      border: 2px solid #caf982;
      background-color: #caf982;
    }
    &.node-review {
      width: 120px;
      height: 50px;
      border-radius: 4px;
      border: 2px solid #81d3f8;
      background-color: #81d3f8;
    }
  }
}
</style>
