<template>
  <div class="input-search">
    <el-select
      v-model="type"
      placeholder="类型"
      style="width: 80px"
      :teleported="false"
      class="search-select"
      v-if="props.filter"
    >
      <el-option
        v-for="item in filterType"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <el-select
      v-model="value"
      filterable
      remote
      placeholder="请输入地区"
      :remote-method="remoteMethod"
      :loading="loading"
      style="width: 240px"
      :teleported="false"
      @change="search"
      class="search-input"
      no-data-text="暂无数据"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <el-button type="primary" :icon="Search" @click="search" />
  </div>
</template>

<script lang="ts">
export default { name: "InputSearch" };
</script>
<script lang="ts" setup>
import { ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import { filterType } from "../views/Cesium/index";

const props = defineProps({
  filter: {
    type: Boolean,
    default: false,
  },
});
const emits = defineEmits(["search"]);
const value = ref("");
const type = ref("");
const options = ref<any>([]);
const loading = ref(false);
let data = [
  {
    label: "1",
    value: "1",
  },
  {
    label: "2",
    value: "2",
  },
  {
    label: "3",
    value: "3",
  },
  {
    label: "4",
    value: "4",
  },
  {
    label: "5",
    value: "5",
  },
  {
    label: "6",
    value: "6",
  },
  {
    label: "7",
    value: "7",
  },
];

const remoteMethod = (query: string) => {
  if (query) {
    loading.value = true;
    setTimeout(() => {
      options.value = data.filter((item) => {
        return item.label.toLowerCase().includes(query.toLowerCase());
      });
      loading.value = false;
    }, 200);
  } else {
    options.value = [];
  }
};

const search = () => {
  if (props.filter) {
    emits("search", { type: type.value, value: value.value });
  } else {
    emits("search", { value: value.value });
  }
};

defineExpose({
  search,
});
</script>

<style lang="scss" scoped>
:deep(.search-input .el-select__wrapper) {
  border-radius: 0;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  background-color: rgba(27, 27, 27, 0.8);
  .el-select__placeholder {
    color: #fff;
  }
  .el-select__caret {
    color: #fff;
  }
}
:deep(.search-select .el-select__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: 1px 1px 0 0 var(--el-color-primary) inset,
    0 -1px 0 0 var(--el-color-primary) inset;
  background-color: rgba(27, 27, 27, 0.8);
  .el-select__placeholder {
    color: #fff;
  }
  .el-select__caret {
    color: #fff;
  }
}
.el-button {
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  border-left: none;
}
:deep(.el-select__popper.el-popper) {
  background-color: rgba(27, 27, 27, 0.8);
  border-color: var(--el-color-primary);
  .el-select-dropdown__item {
    color: #fff;
  }
  .el-select-dropdown__item.is-hovering {
    background-color: rgba(63, 63, 63, 0.7);
  }
  .el-popper__arrow::before {
    background-color: rgba(63, 63, 63, 0.7);
    border-color: var(--el-color-primary);
  }
}
</style>
