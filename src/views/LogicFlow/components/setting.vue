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
import FlowSetting from "./setting/flow-setting.vue";
import StartFlowSetting from "./setting/start-flow-setting.vue";
import ActionSetting from "./setting/action-setting.vue";
import EdgeSetting from "./setting/edge-setting.vue";
import LinkSetting from "./setting/link-setting.vue";
import ReviewSetting from "./setting/review-setting.vue";

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
      comp = ActionSetting;
      break;
    case "link":
      comp = LinkSetting;
      break;
    case "review":
      comp = ReviewSetting;
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
