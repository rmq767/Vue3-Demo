<template>
  <div class="node-setting">
    <div class="setting-title">节点属性</div>
    <div class="setting-item">
      <el-form :model="form" label-width="110px">
        <div class="setting-item-title">基础属性</div>
        <el-form-item label="节点名称" required>
          <el-input v-model="form.nodeName" @blur="validateNodeName" />
        </el-form-item>
        <div class="setting-item-title">发起者</div>
        <el-form-item label="发起者" required>
          <el-input
            v-model="form.initiatorString"
            readonly
            @click="choosePerson"
          />
        </el-form-item>
        <div class="setting-item-title">操作权限</div>
        <el-form-item label="更多操作">
          <el-checkbox-group
            v-model="form.startMoreAction"
            @change="changeMoreAction"
          >
            <el-checkbox
              v-for="item in startFlowMoreAction"
              :key="item.value"
              :value="item.value"
              >{{ item.label }}</el-checkbox
            >
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </div>
    <ChoosePerson ref="choosePersonRef" @submit="getPerson" />
  </div>
</template>

<script lang="ts">
export default { name: "StartFlowSetting" };
</script>
<script lang="ts" setup>
import { ref, watch } from "vue";
import { startFlowMoreAction } from "../../index";
import LogicFlow from "@logicflow/core";
import ChoosePerson from "../choose-person.vue";
import { CheckboxValueType, ElMessage } from "element-plus";
import { MyLogicFlowPropertiesType } from "@/types/logic-flow";

const props = defineProps<{
  lf?: LogicFlow;
  data: LogicFlow.NodeData | LogicFlow.EdgeData;
}>();
const form = ref({
  nodeName: "",
  initiator: [] as string[],
  initiatorString: "",
  startMoreAction: ["back"],
});
const choosePersonRef = ref<InstanceType<typeof ChoosePerson>>();
watch(
  () => props.data,
  (newVal) => {
    const { initiator, initiatorString, startMoreAction } =
      newVal.properties as MyLogicFlowPropertiesType;
    form.value = {
      nodeName: newVal.text?.value!,
      initiator: initiator || [],
      initiatorString: initiatorString || "",
      startMoreAction: startMoreAction || ["back"],
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
 * @description 选择发起人
 */
const choosePerson = () => {
  choosePersonRef.value?.open(form.value.initiator);
};
const getPerson = (checked: string[], list: any[]) => {
  form.value.initiator = checked;
  form.value.initiatorString = list.map((item) => item.label).join("，");
  if (!checked.length) {
    ElMessage.warning("发起者不能为空");
    props.lf?.setProperties(props.data.id, {
      initiator: [],
      initiatorString: "",
    });
  } else {
    props.lf?.setProperties(props.data.id, {
      initiator: form.value.initiator,
      initiatorString: form.value.initiatorString,
    });
  }
};
/**
 * @description 验证表单
 */
const validateNodeName = (e: FocusEvent) => {
  const value = (e.target as HTMLInputElement).value;
  if (!value) {
    ElMessage.warning("节点名称不能为空");
    form.value.nodeName = props.data.text?.value!;
  } else {
    props.lf?.updateText(props.data.id, value);
  }
};
/**
 * @description 更多操作
 */
const changeMoreAction = (val: CheckboxValueType[]) => {
  props.lf?.setProperties(props.data.id, {
    startMoreAction: val,
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
