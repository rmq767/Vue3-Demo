<template>
  <div class="setting">
    <component :is="component" :lf="props.lf" :data="props.data"></component>
  </div>
</template>

<script lang="ts">
export default { name: "Setting" };
</script>
<script lang="ts" setup>
import { SettingType } from "@/types/logic-flow";
import LogicFlow from "@logicflow/core";
import { computed } from "vue";
import FlowSetting from "./flow-setting.vue";
import StartFlowSetting from "./start-flow-setting.vue";
import ActionSetting from "./action-setting.vue";
import EdgeSetting from "./edge-setting.vue";

const props = defineProps<{
  lf?: LogicFlow;
  data: LogicFlow.NodeData | LogicFlow.EdgeData;
  type: SettingType;
}>();
/**
 * @description 标题
 */
const component = computed(() => {
  let comp = null as any;
  switch (props.type) {
    case "all":
      comp = FlowSetting;
      break;
    case "launch":
      comp = StartFlowSetting;
      break;
    case "approver":
    case "link":
    case "review":
      comp = ActionSetting;
      break;
    case "polyline":
    case "dashedLine":
      comp = EdgeSetting;
      break;
    default:
      comp = FlowSetting;
      break;
  }
  return comp;
});
</script>

<style lang="scss" scoped>
.setting {
  padding: 20px 10px;
  box-sizing: border-box;
}
</style>
