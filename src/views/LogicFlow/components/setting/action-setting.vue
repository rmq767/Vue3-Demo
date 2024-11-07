<template>
  <div class="node-setting">
    <div class="setting-title">节点属性</div>
    <div class="setting-item">
      <el-form :model="form" label-width="110px">
        <div class="setting-item-title">基础属性</div>
        <el-form-item label="节点名称" required>
          <el-input v-model="form.nodeName" @blur="validateNodeName" />
        </el-form-item>
        <div class="setting-item-title">审核者</div>
        <el-form-item label="审核者来源" required>
          <el-radio-group
            v-model="form.reviewerSource"
            @change="changeReviewerSource"
          >
            <el-radio value="1">发起者选择</el-radio>
            <el-radio value="2">指定</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          label="审核者"
          v-if="form.reviewerSource === '2'"
          required
        >
          <el-input
            v-model="form.reviewerString"
            readonly
            @click="choosePerson"
          />
        </el-form-item>
        <el-form-item label="多人审核方式" required>
          <el-radio-group
            v-model="form.auditMethod"
            @change="changeAuditMethod"
          >
            <el-radio value="1">会签</el-radio>
            <el-radio value="2">或签</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核过流程">
          <el-checkbox
            v-model="form.pass"
            label="直接通过"
            @change="changePass"
          />
        </el-form-item>
        <div class="setting-item-title">操作权限</div>
        <el-form-item label="基本操作" required>
          <el-checkbox-group
            v-model="form.baseAction"
            :min="1"
            @change="changeBaseAction"
          >
            <el-checkbox
              v-for="item in baseAction"
              :key="item.value"
              :value="item.value"
              >{{ item.label }}</el-checkbox
            >
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="退回操作" required>
          <el-radio-group v-model="form.backAction" @change="changeBackAction">
            <el-radio value="1">退回到发起人</el-radio>
            <el-radio value="2">退回到上一节点</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="更多操作">
          <el-checkbox-group
            v-model="form.moreAction"
            @change="changeMoreAction"
          >
            <el-checkbox
              v-for="item in auditMoreAction"
              :key="item.value"
              :value="item.value"
              >{{ item.label }}</el-checkbox
            >
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </div>
    <ChoosePerson ref="choosePersonRef" :key="data.id" @submit="getPerson" />
  </div>
</template>

<script lang="ts">
export default { name: "ActionSetting" };
</script>
<script lang="ts" setup>
import { ref, watch } from "vue";
import { baseAction, auditMoreAction } from "../../index";
import LogicFlow from "@logicflow/core";
import ChoosePerson from "../choose-person.vue";
import { ElMessage } from "element-plus";
import { MyLogicFlowPropertiesType } from "@/types/logic-flow";

const props = defineProps<{
  lf?: LogicFlow;
  data: LogicFlow.NodeData | LogicFlow.EdgeData;
}>();
const form = ref({
  nodeName: "",
  reviewerSource: "2",
  auditMethod: "1",
  pass: false,
  reviewer: [] as string[],
  reviewerString: "",
  moreAction: ["back"],
  baseAction: ["agree", "reject", "back"],
  backAction: "1",
});
const choosePersonRef = ref<InstanceType<typeof ChoosePerson>>();
watch(
  () => props.data,
  (newVal) => {
    const {
      reviewerSource,
      reviewer,
      reviewerString,
      auditMethod,
      pass,
      baseAction,
      backAction,
      moreAction,
    } = newVal.properties as MyLogicFlowPropertiesType;
    form.value = {
      nodeName: newVal.text?.value!,
      reviewerSource: reviewerSource || "2",
      reviewer: reviewer || [],
      reviewerString: reviewerString || "",
      auditMethod: auditMethod || "1",
      pass: pass || false,
      baseAction: baseAction || ["agree", "reject", "back"],
      backAction: backAction || "1",
      moreAction: moreAction || ["back"],
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
  choosePersonRef.value?.open(form.value.reviewer);
};
const getPerson = (checked: string[], list: any[]) => {
  form.value.reviewer = checked;
  form.value.reviewerString = list.map((item) => item.label).join("，");
  if (!checked.length) {
    ElMessage.warning("审核者不能为空");
    props.lf?.setProperties(props.data.id, {
      reviewer: [],
      reviewerString: "",
    });
  } else {
    props.lf?.setProperties(props.data.id, {
      reviewer: form.value.reviewer,
      reviewerString: form.value.reviewerString,
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
 * @description 审核者来源
 */
const changeReviewerSource = (value: string) => {
  props.lf?.setProperties(props.data.id, {
    reviewerSource: value,
  });
  if (value === "1") {
    form.value.reviewer = [];
    form.value.reviewerString = "";
    choosePersonRef.value?.clear();
  }
};
/**
 * @description 多人审核方式
 */
const changeAuditMethod = (value: string) => {
  props.lf?.setProperties(props.data.id, {
    auditMethod: value,
  });
};
/**
 * @description 审核过流程
 */
const changePass = (value: string) => {
  props.lf?.setProperties(props.data.id, {
    pass: value,
  });
};
/**
 * @description 基本操作
 */
const changeBaseAction = (val: string[]) => {
  props.lf?.setProperties(props.data.id, {
    baseAction: val,
  });
};
/**
 * @description 退回操作
 */
const changeBackAction = (value: string) => {
  props.lf?.setProperties(props.data.id, {
    backAction: value,
  });
};
/**
 * @description 更多操作
 */
const changeMoreAction = (val: string[]) => {
  props.lf?.setProperties(props.data.id, {
    moreAction: val,
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
