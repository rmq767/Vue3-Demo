<template>
  <div class="node-setting">
    <div class="setting-title">连接点属性</div>
    <div class="setting-item">
      <el-form :model="form" label-width="110px">
        <div class="setting-item-title">基础属性</div>
        <el-form-item label="显示名称" required>
          <el-input v-model="form.nodeName" @blur="validateNodeName" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "LinkSetting" };
</script>
<script lang="ts" setup>
import { ref, watch } from "vue";
import LogicFlow from "@logicflow/core";
import { ElMessage } from "element-plus";

const props = defineProps<{
  lf?: LogicFlow;
  data: LogicFlow.NodeData | LogicFlow.EdgeData;
}>();
const form = ref({
  nodeName: "",
});
watch(
  () => props.data,
  (newVal) => {
    form.value = {
      nodeName: newVal.text?.value!,
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
