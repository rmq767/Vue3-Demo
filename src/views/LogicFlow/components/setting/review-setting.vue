<template>
  <div class="node-setting">
    <div class="setting-title">节点属性</div>
    <div class="setting-item">
      <el-form :model="form" label-width="110px">
        <div class="setting-item-title">基础属性</div>
        <el-form-item label="节点名称" required>
          <el-input v-model="form.nodeName" @blur="validateNodeName" />
        </el-form-item>
        <div class="setting-item-title">传阅者</div>
        <el-form-item label="传阅者来源" required>
          <el-radio-group
            v-model="form.readerSource"
            @change="changeReaderSource"
          >
            <el-radio value="1">发起者选择</el-radio>
            <el-radio value="2">指定</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="传阅者" v-if="form.readerSource === '2'" required>
          <el-input
            v-model="form.readerString"
            readonly
            @click="choosePerson"
          />
        </el-form-item>
      </el-form>
    </div>
    <ChoosePerson ref="choosePersonRef" @submit="getPerson" />
  </div>
</template>

<script lang="ts">
export default { name: "ReviewSetting" };
</script>
<script lang="ts" setup>
import { ref, watch } from "vue";
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
  reader: [] as string[],
  readerString: "",
  readerSource: "2",
});
const choosePersonRef = ref<InstanceType<typeof ChoosePerson>>();
watch(
  () => props.data,
  (newVal) => {
    const { reader, readerString, readerSource } =
      newVal.properties as MyLogicFlowPropertiesType;
    form.value = {
      nodeName: newVal.text?.value!,
      reader: reader || [],
      readerString: readerString || "",
      readerSource: readerSource || "2",
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
  choosePersonRef.value?.open(form.value.reader);
};
const getPerson = (checked: string[], list: any[]) => {
  form.value.reader = checked;
  form.value.readerString = list.map((item) => item.label).join("，");
  if (!checked.length) {
    ElMessage.warning("传阅者不能为空");
    props.lf?.setProperties(props.data.id, {
      reader: [],
      readerString: "",
    });
  } else {
    props.lf?.setProperties(props.data.id, {
      reader: form.value.reader,
      readerString: form.value.readerString,
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
 * @description 传阅者来源
 */
const changeReaderSource = (value: string | number | boolean | undefined) => {
  props.lf?.setProperties(props.data.id, {
    reviewerSource: value,
  });
  if (value === "1") {
    form.value.reader = [];
    form.value.readerString = "";
    choosePersonRef.value?.clear();
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
