<template>
  <div class="fn-editor-container">
    <el-button type="primary" @click="toEditFn1">编辑函数</el-button>
    <el-button type="warning" @click="toEditFn2">修改函数</el-button>

    <FnEditor ref="fnEditorRef" @submit="submitFn"></FnEditor>
  </div>
</template>

<script lang="ts">
export default { name: "FnEditor" };
</script>
<script lang="ts" setup>
import FnEditor from "@/components/FnEditor/index.vue";
import { ref } from "vue";

const fnEditorRef = ref<InstanceType<typeof FnEditor>>();

const submitFn = ({ text, params }: { text: string; params: any[] }) => {
  console.log(text, params);
};

const toEditFn1 = () => {
  fnEditorRef.value?.open("basic");
};

const toEditFn2 = () => {
  const data = {
    fn: "y=exp(x)+sqrt(a)a",
    params: [
      {
        name: "y",
        id: "1",
        index: 0,
      },
      {
        name: "x",
        id: "2",
        index: 6,
      },
      { name: "a", id: "3", index: 14 },
    ],
  };
  fnEditorRef.value?.open("combo", data);
};
</script>

<style lang="scss" scoped>
.fn-editor-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
