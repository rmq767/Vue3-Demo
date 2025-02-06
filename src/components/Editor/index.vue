<template>
  <MyDialog
    v-model="state.visible"
    title="Editor"
    :width="800"
    center
    :close-on-click-modal="false"
    :before-close="close"
  >
    <div class="editor-container">
      <TreeCom
        class="editor-tree"
        :data="state.paramsData"
        @node-click="insertTag"
      ></TreeCom>
      <div class="editor-content">
        <div class="editor-main" ref="editorRef"></div>
        <div class="fn">
          <div class="fn-list">
            <TreeCom
              :default-expand-all="true"
              :data="state.fnData"
              @node-click="insertFn"
              @mouseenter="hoverFn"
            ></TreeCom>
          </div>
          <div class="fn-desc">
            <DescCom v-bind="state.info"></DescCom>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div>
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="submit">确认</el-button>
      </div>
    </template>
  </MyDialog>
</template>

<script lang="ts">
export default { name: "Editor" };
</script>
<script lang="ts" setup>
import { nextTick, reactive } from "vue";
import TreeCom from "./components/tree.vue";
import DescCom from "./components/desc.vue";
import { useCodemirror, functionDescription } from ".";
import { Tree } from "@/types/common";

const state = reactive({
  visible: false,
  paramsData: [
    {
      label: "参数1",
      id: "1",
    },
    {
      label: "参数2",
      id: "2",
    },
    {
      label: "参数3",
      id: "3",
    },
  ],
  fnData: [
    {
      label: "常用函数",
      id: "1",
      children: [
        {
          label: "SUM",
          desc: "求和",
          id: "1-1",
        },
        {
          label: "IF",
          desc: "条件判断",
          id: "1-2",
        },
      ],
    },
  ],
  info: {},
});

const { code, view, editorRef, init, destroyed, insertText } = useCodemirror();
/**
 * @description 插入标签
 */
const insertTag = (data: Tree) => {
  if (!data.children) {
    insertText(`${data.id}.${data.label}`);
  }
};
/**
 * @description 插入函数
 */
const insertFn = (data: Tree) => {
  if (!data.children) {
    insertText(`${data.label}`, "fn");
  }
};
/**
 * @description 鼠标悬停展示函数描述
 */
const hoverFn = (data: Tree) => {
  const info = functionDescription(data.label);
  if (info) {
    state.info = info;
  }
};
/**
 * @description 获取数据
 */
const submit = () => {
  const data = view.value?.state.doc;
  console.log(data);
};
const open = () => {
  state.visible = true;
  nextTick(() => {
    init();
  });
};
const close = (done: any) => {
  destroyed();
  done();
};

defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.editor-container {
  position: relative;
  .editor-tree {
    width: 200px;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
  }
  .editor-content {
    margin-left: 210px;
    display: flex;
    flex-direction: column;
    .editor-main {
      border: 1px solid #ccc;
      height: 200px;
    }
    .fn {
      display: flex;
      height: 200px;
      > div {
        flex: 1;
        border: 1px solid #ccc;
      }
    }
  }
}
:deep(.cm-focused) {
  outline: none;
}
:deep(.cm-gutters) {
  display: none;
}
</style>
