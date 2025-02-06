<template>
  <div>
    <el-button type="primary" size="default" @click="open">编辑</el-button>
    <Editor ref="editor"></Editor>
  </div>
</template>

<script lang="ts">
export default { name: "RulesEditor" };
</script>
<script lang="ts" setup>
import Editor from "@/components/Editor/index.vue";
import { ref } from "vue";

const editor = ref<InstanceType<typeof Editor>>();

const open = () => {
  editor.value?.open();
};
</script>

<style lang="scss" scoped></style>
