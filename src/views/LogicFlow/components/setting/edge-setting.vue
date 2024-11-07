<template>
  <div class="flow-setting">
    <div class="setting-title">条件属性</div>
    <div class="setting-item">
      <div class="setting-item-title">基础属性</div>
      <el-form :model="form" label-width="110px">
        <el-form-item label="条件名称">
          <el-input v-model="form.conditionName" @blur="changeConditionName" />
        </el-form-item>
        <el-form-item label="是否使用其他">
          <el-radio-group v-model="form.useOther" @change="changeUseOther">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="条件设置">
          <el-input v-model="form.condition" @blur="changeCondition" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "EdgeSetting" };
</script>
<script lang="ts" setup>
import { MyLogicFlowPropertiesType } from "@/types/logic-flow";
import LogicFlow from "@logicflow/core";
import { ElMessage } from "element-plus";
import { ref, watch } from "vue";

const props = defineProps<{
  lf?: LogicFlow;
  data: LogicFlow.NodeData | LogicFlow.EdgeData;
}>();
const form = ref({
  conditionName: "条件1",
  useOther: false,
  condition: "",
});
watch(
  () => props.data,
  (newVal) => {
    const { useOther, condition, conditionName } =
      newVal.properties as MyLogicFlowPropertiesType;
    form.value = {
      conditionName: conditionName || "",
      useOther: useOther || false,
      condition: condition || "",
    };
    props.lf?.setProperties(newVal.id, {
      ...form.value,
    });
  },
  {
    immediate: true,
  }
);
/**
 * @description 条件名称
 */
const changeConditionName = (e: FocusEvent) => {
  const value = (e.target as HTMLInputElement).value;
  props.lf?.setProperties(props.data.id, {
    conditionName: value,
  });
};
/**
 * @description 是否使用其他
 */
const changeUseOther = (value: boolean) => {
  // 获取边的model
  const model = props.lf?.getEdgeModelById(props.data.id);
  // 获取父节点的id
  const parentNodeId = model?.sourceNodeId;
  // 获取父节点的所有出边
  const childEdge = props.lf?.getNodeOutgoingEdge(parentNodeId!);
  // 判断父节点的出边是否已经存在其他条件
  const hasUseOther = childEdge?.some((item) => {
    const { useOther } = item.properties as MyLogicFlowPropertiesType;
    return useOther;
  });
  if (hasUseOther && value) {
    ElMessage.warning("该节点已存在其他条件，请先修改其他条件");
    form.value.useOther = false;
    return;
  } else {
    props.lf?.setProperties(props.data.id, {
      useOther: value,
    });
  }
};
/**
 * @description 条件设置
 */
const changeCondition = (e: FocusEvent) => {
  const value = (e.target as HTMLInputElement).value;
  if (value) {
    props.lf?.changeEdgeType(props.data.id, "dashedLine");
  }
  props.lf?.setProperties(props.data.id, {
    condition: value,
  });
};
</script>

<style lang="scss" scoped>
.setting-title {
  padding: 10px 0;
  border-bottom: 1px solid #e9e9e9;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}
.setting-item {
  .setting-item-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #e9e9e9;
  }
}
</style>
