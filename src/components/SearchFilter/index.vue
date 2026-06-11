<template>
  <div class="search-filter">
    <el-form ref="formRefEl" :model="formData" inline>
      <el-form-item
        v-for="item in filters"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
      >
        <!-- input -->
        <el-input
          v-if="item.type === 'input'"
          v-model="formData[item.prop]"
          :placeholder="item.placeholder || `请输入${item.label}`"
          clearable
        />
        <!-- select -->
        <el-select
          v-else-if="item.type === 'select'"
          v-model="formData[item.prop]"
          :placeholder="item.placeholder || `请选择${item.label}`"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="opt in item.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <!-- date-picker -->
        <el-date-picker
          v-else-if="item.type === 'date-picker'"
          v-model="formData[item.prop]"
          :type="item.pickerType ?? 'date'"
          :placeholder="item.placeholder || `请选择${item.label}`"
          style="width: 100%"
        />
        <!-- date-range -->
        <el-date-picker
          v-else-if="item.type === 'date-range'"
          v-model="formData[item.prop]"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 100%"
        />
        <!-- slot — 自定义组件 -->
        <slot v-else-if="item.type === 'slot'" :name="item.slot || item.prop" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="$emit('search')">搜索</el-button>
        <el-button @click="$emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
    <slot></slot>
  </div>
</template>

<script lang="ts">
export default { name: "SearchFilter" };
</script>

<script setup lang="ts">
import type { FilterItem } from "@/types/common";

defineProps<{
  filters: FilterItem[];
  formData: Record<string, any>;
}>();

defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<style lang="scss" scoped>
.search-filter {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
  .el-form-item {
    .el-input,
    .el-select,
    .el-date-picker {
      width: 160px !important;
    }
  }
}
</style>
