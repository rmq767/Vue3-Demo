<template>
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      :background="background"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script lang="ts">
export default { name: "Pagination" };
</script>

<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    total: number;
    page?: number;
    size?: number;
    pageSizes?: number[];
    layout?: string;
    background?: boolean;
  }>(),
  {
    page: 1,
    size: 20,
    pageSizes: () => [10, 20, 30, 50],
    layout: "total, sizes, prev, pager, next, jumper",
    background: true,
  },
);

const emit = defineEmits<{
  "update:page": [value: number];
  "update:size": [value: number];
  pagination: [{ page: number; size: number }];
}>();

const currentPage = computed({
  get: () => props.page,
  set: (val: number) => {
    emit("update:page", val);
  },
});

const pageSize = computed({
  get: () => props.size,
  set: (val: number) => {
    emit("update:size", val);
  },
});

const handleCurrentChange = (val: number) => {
  emit("pagination", { page: val, size: pageSize.value });
};

const handleSizeChange = (val: number) => {
  emit("pagination", { page: currentPage.value, size: val });
};
</script>

<style scoped lang="scss">
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}
</style>
