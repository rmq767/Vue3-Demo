<template>
  <el-table ref="tableRef" :data="props.data" v-bind="$attrs">
    <el-table-column
      v-if="props.index"
      align="center"
      label="序号"
      type="index"
      width="60"
    />
    <el-table-column v-if="props.radio" align="center" label="单选" width="60">
      <template #default="{ row }">
        <slot name="radio" :row="row"></slot>
      </template>
    </el-table-column>
    <el-table-column
      v-for="col in column"
      :key="col.label"
      :prop="col.prop"
      :label="col.label"
      :width="col.width"
      align="center"
      :column-key="col.prop"
      :filters="col.filters"
    >
      <!-- 处理时间格式 -->
      <!-- <template v-if="col.template === 'date'" #default="{ row }">{{
                parseTime(row[col.prop], DateTimeFormat.DATE)
            }}</template> -->
      <!-- 处理状态 例如el-tag对应不同颜色 -->
      <!-- <template v-else-if="col.template === 'status'" #default="{ row }">
                <slot name="status" :row="row"></slot>
            </template> -->
      <!-- 处理进度 -->
      <template v-if="col.template === 'progress'" #default="{ row }">
        <el-progress
          :text-inside="true"
          :stroke-width="16"
          :percentage="row[col.prop] <= 1 ? row[col.prop] * 100 : row[col.prop]"
          :color="row.color ? row.color : colors"
        />
      </template>
      <!-- 自定义，其他特殊处理 -->
      <template v-else-if="col.slot" #default="{ row }">
        <slot :name="col.slot" :row="row"></slot>
      </template>
    </el-table-column>

    <slot></slot>
  </el-table>
</template>

<script lang="ts" name="ShowTable" setup>
import { ref, withDefaults } from "vue";
import { TableColumn, DateTimeFormat } from "@/types/common";
import { TableInstance } from "element-plus";

const props = withDefaults(
  defineProps<{
    data: Array<any>;
    column: Array<TableColumn>;
    index?: boolean;
    radio?: boolean;
  }>(),
  {
    index: true,
    radio: false,
  }
);
const tableRef = ref<TableInstance>();
const colors = [
  { color: "#F56C6C", percentage: 50 },
  { color: "#E6A23C", percentage: 60 },
  { color: "#409EFF", percentage: 80 },
  { color: "#67C23A", percentage: 100 },
];

defineExpose({
  tableRef,
});
</script>
