<template>
  <div class="vxe-table-wrapper">
    <vxe-table
      :columns="[]"
      :data="data"
      :loading="loading"
      :row-config="{ isHover: true }"
      v-bind="$attrs"
    >
      <vxe-column type="seq" title="序号" width="60" align="center" />
      <vxe-column
        v-for="col in columns.filter((c) => c.visible !== false)"
        :key="col.field"
        show-overflow="tooltip"
        v-bind="col"
      >
        <template v-if="col.slot" #default="{ row }">
          <slot :name="col.field" :row="row" />
        </template>
      </vxe-column>
    </vxe-table>
  </div>
</template>

<script lang="ts">
export default { name: "VxeTable" };
</script>

<script setup lang="ts">
import type { VxeColumn as VxeColumnType } from "@/types/common";
import { VxeTable, VxeColumn } from "vxe-table";

interface Props {
  columns: VxeColumnType[];
  data: any[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

defineSlots<{
  [key: string]: (props: any) => any;
}>();
</script>

<style scoped>
.vxe-table-wrapper {
  background: #fff;
}
</style>
