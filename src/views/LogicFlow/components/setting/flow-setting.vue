<template>
  <div class="flow-setting">
    <div class="setting-title">流程属性</div>
    <div class="setting-item">
      <div class="setting-item-title">基础属性</div>
      <el-form :model="form" label-width="110px">
        <el-form-item label="流程名称">
          <el-input v-model="form.processName" />
        </el-form-item>
        <el-form-item label="业务名称">
          <el-input v-model="form.businessName" disabled />
        </el-form-item>
        <el-form-item label="关联操作">
          <el-checkbox-group v-model="form.action">
            <el-checkbox
              v-for="item in flowAction"
              :key="item.value"
              :value="item.value"
              >{{ item.label }}</el-checkbox
            >
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="流程运行">
          <el-radio-group v-model="form.processRun">
            <el-radio value="on">启用</el-radio>
            <el-radio value="off">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "FlowSetting" };
</script>
<script lang="ts" setup>
import LogicFlow from "@logicflow/core";
import { ref } from "vue";
import { flowAction } from "../../index";

const props = defineProps<{
  lf?: LogicFlow;
  data: LogicFlow.NodeData | LogicFlow.EdgeData;
}>();
const form = ref({
  processName: "流程1",
  businessName: "业务1",
  action: ["add"],
  processRun: "on",
  remark: "",
});
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
