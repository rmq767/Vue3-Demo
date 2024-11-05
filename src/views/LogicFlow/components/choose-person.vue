<template>
  <MyDialog
    v-model="state.visible"
    title="选择人员"
    width="800px"
    @close="close"
    @cancel="close"
    @submit="submit"
  >
    <div class="type">
      <label>
        <span>发起人：</span>
        <el-radio-group v-model="state.type">
          <el-radio value="1">指定人员</el-radio>
          <el-radio value="2">角色</el-radio>
        </el-radio-group>
      </label>
    </div>
    <div class="panel">
      <div class="left-panel">
        <div class="panel-title">人员选择</div>
        <div class="search">
          <el-input
            v-model="state.filterText"
            style="width: 100%"
            placeholder="请输入筛选内容"
          />
        </div>
        <div class="content">
          <el-tree
            ref="treeRef"
            :data="state.data"
            show-checkbox
            node-key="key"
            :check-on-click-node="true"
            :filter-node-method="filterNode"
            @check-change="checkChange"
          />
        </div>
      </div>
      <div class="right-panel">
        <div class="panel-title">已选择</div>
        <div class="content checked-content">
          <el-tag
            v-for="tag in state.checkedList"
            :key="tag.key"
            closable
            type="primary"
            @close="handleClose(tag.key)"
          >
            {{ tag.label }}
          </el-tag>
        </div>
      </div>
    </div>
  </MyDialog>
</template>

<script lang="ts">
export default { name: "ChoosePerson" };
</script>
<script lang="ts" setup>
import { ElTree } from "element-plus";
import { nextTick, reactive, ref, watch } from "vue";
interface Tree {
  [key: string]: any;
}
const state = reactive({
  visible: false,
  type: "1",
  filterText: "",
  value: [],
  data: [
    {
      label: "张三",
      key: "1",
    },
    {
      label: "李四",
      key: "2",
    },
    {
      label: "王五",
      key: "3",
      children: [
        {
          label: "王五1",
          key: "31",
        },
        {
          label: "王五2",
          key: "32",
        },
      ],
    },
  ],
  checked: [] as string[],
  checkedList: [] as { label: string; key: string }[],
});
const treeRef = ref<InstanceType<typeof ElTree>>();
const emits = defineEmits(["submit"]);
/**
 * @description 筛选节点
 */
watch(
  () => state.filterText,
  (val) => {
    treeRef.value!.filter(val);
  }
);
const open = (checked: string[]) => {
  state.visible = true;
  nextTick(() => {
    state.checked = checked;
    treeRef.value?.setCheckedKeys([...checked], false);
  });
};
const close = () => {
  state.visible = false;
};
const submit = () => {
  state.visible = false;
  emits("submit", state.checked, state.checkedList);
};
/**
 * @description 筛选节点
 */
const filterNode = (value: string, data: Tree) => {
  if (!value) return true;
  return data.label.includes(value);
};
/**
 * @description 选中节点
 */
const checkChange = () => {
  state.checked = treeRef.value
    ?.getCheckedNodes(true, false)
    .map((item) => item.key) as string[];
  state.checkedList = treeRef.value
    ?.getCheckedNodes(true, false)
    .map((item) => {
      return {
        label: item.label,
        key: item.key,
      };
    })!;
};
/**
 * @description 删除已选人员
 */
const handleClose = (key: string) => {
  state.checkedList = state.checkedList.filter((item) => item.key !== key);
  treeRef.value?.setCheckedKeys(
    state.checkedList.map((item) => item.key),
    false
  );
};
/**
 * @description 清空已选人员
 */
const clear = () => {
  state.checkedList = [];
  state.checked = [];
  treeRef.value?.setCheckedKeys([], false);
};
defineExpose({
  open,
  clear,
});
</script>

<style lang="scss" scoped>
.type {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  span {
    margin-right: 10px;
  }
  label {
    display: flex;
    align-items: center;
  }
}
.panel {
  width: 100%;
  display: flex;
  .left-panel {
    flex: 1;
    border: 1px solid #ccc;
    border-radius: 4px;
    .search {
      padding: 6px 10px;
    }
  }
  .right-panel {
    flex: 1;
    margin-left: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .panel-title {
    padding: 10px 0;
    font-size: 14px;
    font-weight: bold;
    background-color: #f5f5f5;
    text-align: center;
  }
  .content {
    max-height: 400px;
    min-height: 200px;
    overflow: auto;
  }
  .checked-content {
    padding: 6px 10px;
    .el-tag + .el-tag {
      margin-left: 10px;
    }
  }
}
</style>
