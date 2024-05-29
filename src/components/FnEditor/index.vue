<template>
  <MyDialog
    v-model="state.visible"
    title="函数编辑器"
    fullscreen
    @close="close"
    @cancel="close"
    @submit="submit"
  >
    <el-row :gutter="20">
      <el-col :span="12" class="panel">
        <div
          ref="textRef"
          class="fn-editor"
          :contenteditable="true"
          @blur="onBlur"
        ></div>
        <div class="check">
          <el-button type="primary" :icon="Check">函数校验</el-button>
        </div>
      </el-col>
      <el-col :span="12"> <FnPanel @get-value="getValue" /></el-col>
    </el-row>
    <div class="mb-1 mt-4">
      <el-input
        v-model="state.search"
        :style="{ width: '300px' }"
        placeholder="参数名称"
      >
        <template #append> <el-button :icon="Search" /> </template
      ></el-input>
    </div>
    <el-tabs v-model="state.activeTab" @tab-click="handleClick">
      <el-tab-pane label="函数参数库" name="1">
        <ShowTable
          ref="tableRef1"
          :data="state.tableData"
          :column="state.column"
          highlight-current-row
          @current-change="handleCurrentChange"
        >
        </ShowTable>
      </el-tab-pane>
      <el-tab-pane v-if="state.type === 'basic'" label="组合函数库" name="2">
        <ShowTable
          ref="tableRef2"
          :data="state.tableData"
          :column="state.column"
          highlight-current-row
          @current-change="handleCurrentChange"
        >
        </ShowTable>
      </el-tab-pane>
    </el-tabs>
  </MyDialog>
</template>

<script lang="ts">
export default { name: "CreateFn" };
</script>
<script lang="ts" setup>
import { reactive, ref } from "vue";
import FnPanel from "./components/fn-panel.vue";
import ShowTable from "@/components/ShowTable/index.vue";
import { Check, Search } from "@element-plus/icons-vue";
import { DatabaseManagementParamsForm } from "@/types/fn-param-management";
import { ElMessage, TableInstance, TabsPaneContext } from "element-plus";
import { shallowRef } from "vue";
import { FnEditorData } from "@/types/combination-fn-management";
import { nextTick } from "vue";

const state = reactive({
  visible: false,
  fn: "",
  search: "",
  activeTab: "1",
  tableData: [
    {
      abbreviation: "y",
      name: "Y参数",
      id: "1",
    },
    {
      abbreviation: "x",
      name: "X参数",
      id: "2",
    },
    {
      abbreviation: "a",
      name: "A参数",
      id: "3",
    },
    {
      abbreviation: "b",
      name: "B参数",
      id: "4",
    },
  ],
  column: [
    {
      label: "参数缩写",
      prop: "abbreviation",
    },
    {
      label: "参数名称",
      prop: "name",
    },
    {
      label: "参数单位",
      prop: "unit",
    },
    {
      label: "默认取值范围",
      prop: "range",
    },
    {
      label: "创建人",
      prop: "creator",
    },
    {
      label: "参数解释",
      prop: "remark",
    },
  ],
  type: "combo" as "combo" | "basic",
});
const textRef = ref<HTMLDivElement>();
const range = shallowRef<Range>();
const selection = shallowRef<Selection | null>(null);
const tableRef1 = ref<{ tableRef: TableInstance }>();
const tableRef2 = ref<{ tableRef: TableInstance }>();
const emits = defineEmits(["submit"]);
/**
 * @description 输入框失焦 获取到最后的输入框信息
 */
const onBlur = () => {
  selection.value = window.getSelection();
  range.value = selection.value?.getRangeAt(0);
};
/**
 * @description 点击参数展示到输入框
 */
const handleCurrentChange = (item: DatabaseManagementParamsForm) => {
  getSpanTag(item);
};
/**
 * @description 点击函数展示到输入框
 */
const getValue = ({ item, type }: any) => {
  // 创建一个文本节点
  const textNode = document.createTextNode(item.value);
  // 在光标位置插入文本节点
  range.value!.insertNode(textNode);
  // 移动光标到文本节点的末尾
  range.value?.setStartAfter(textNode);
  // 折叠光标到文本节点的末尾
  range.value?.collapse(true);
  // 移除所有选区 不移除selection会到聚焦点击的文本
  selection.value?.removeAllRanges();
  // 添加选区
  selection.value?.addRange(range.value!);
};
/**
 * @description 点击参数展示到输入框
 */
const getSpanTag = (params: DatabaseManagementParamsForm) => {
  // 创建前缀
  let prefix = `<span contenteditable="false" disabled="disabled" class="el-tag el-tag--primary el-tag--small fn-param" data-param="${params.id}">`;
  // 创建后缀
  let suffix = "</span>";
  // 创建span元素
  let el = document.createElement("span");
  // 将前缀和后缀插入span元素
  el.innerHTML = prefix + params.abbreviation + suffix;
  // 去掉外层的span
  let frag = document.createDocumentFragment();
  let node = frag.appendChild(el.firstChild!);
  // 插入tag
  range.value?.insertNode(node);
  // 设置光标
  range.value?.setStartAfter(node);
  range.value?.collapse(true);
  // 不移除selection会到聚焦点击的文本
  selection.value?.removeAllRanges();
  // 添加选区
  selection.value?.addRange(range.value!);
};
/**
 * @description 获取构建的html里面的文本和参数
 */
const getTextAndParams = () => {
  // 获取文本中的参数元素
  const paramsEls = textRef.value?.getElementsByClassName("fn-param");
  // 获取文本的innerHTML
  let innerHTML = textRef.value!.innerHTML;
  // 定义参数数组
  const params = [];
  // 如果参数元素存在
  if (paramsEls) {
    // 遍历参数元素
    for (let index = 0; index < paramsEls.length; index++) {
      // 将参数元素转换为HTMLSpanElement类型
      const element = paramsEls[index] as HTMLSpanElement;
      // 获取参数元素在innerHTML中的索引
      const idx = innerHTML.indexOf(element.outerHTML);
      // 将参数元素添加到参数数组中
      params.push({
        name: element.innerText,
        id: element.dataset.param,
        index: idx,
      });
      // 将参数元素的outerHTML替换为innerHTML
      innerHTML = innerHTML.replace(element.outerHTML, element.innerText);
    }
  }
  // 返回文本和参数数组
  return {
    text: textRef.value!.innerText,
    params,
  };
};

const submit = () => {
  const { text, params } = getTextAndParams();
  if (text.length === 0) {
    ElMessage.warning("请编辑函数内容！");
    return;
  }
  console.log(text, params);
  emits("submit", { text, params });
  close();
};
/**
 * @description 根据数据回显
 */
const reviewFn = (data: FnEditorData) => {
  // 获取data中的fn和params
  const { fn, params } = data;
  // 定义innerHTML，初始值为fn
  let innerHTML = fn;
  // 定义idx，初始值为0
  let idx = 0;
  // 遍历params，将每个param的name插入到innerHTML中
  params.forEach((item) => {
    // 定义prefix，用于创建span标签
    let prefix = `<span contenteditable="false" disabled="disabled" class="el-tag el-tag--primary el-tag--small fn-param" data-param="${item.id}">`;
    // 定义suffix，用于结束span标签
    let suffix = "</span>";
    // 定义tag，用于拼接prefix和suffix
    const tag = prefix + item.name + suffix;
    // 使用正则替换innerHTML中的item.name，替换为tag
    innerHTML = innerHTML.replaceAll(item.name, (match, offset) => {
      // 如果offset等于item.index加上idx，则替换为tag
      if (offset === item.index + idx) {
        return tag;
      }
      // 否则，返回match
      return match;
    });
    // 将tag的长度减去item.name的长度，加到idx上
    idx += tag.length - item.name.length;
  });
  // 延迟执行，将innerHTML设置到textRef的value上
  nextTick(() => {
    textRef.value!.innerHTML = innerHTML;
  });
};

const open = (type: "combo" | "basic", data?: FnEditorData) => {
  state.type = type;
  state.visible = true;
  data && reviewFn(data);
  !data &&
    setTimeout(() => {
      textRef.value?.focus();
    }, 0);
};
const close = () => {
  state.fn = "";
  state.search = "";
  textRef.value!.innerHTML = "";
  state.visible = false;
};

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event);
};

defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.panel {
  position: relative;
  .check {
    margin-top: 10px;
    text-align: right;
  }
}
.fn-editor {
  width: 100%;
  height: 80%;
  padding: 10px;
  box-sizing: border-box;
  overflow: auto;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 20px;
  word-break: break-all;
  outline: none;
  // display: flex;
  // align-items: center;
  // justify-content: center;
  // :deep(.katex-html) {
  //     font-size: 26px;
  // }
}
textarea {
  outline: none;
  font-size: 16px;
}
</style>
