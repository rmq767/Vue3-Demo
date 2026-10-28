<template>
  <div class="property-panel">
    <h3 class="panel-title">卡片属性</h3>
    <template v-if="item">
      <el-form label-width="72px" label-position="left">
        <el-form-item label="标题">
          <el-input
            :model-value="item.props.title"
            maxlength="20"
            show-word-limit
            @update:model-value="updateTitle"
          />
        </el-form-item>
        <el-form-item label="图表类型">
          <el-select
            :model-value="item.props.chartType"
            @update:model-value="updateChartType"
          >
            <el-option
              v-for="option in CHART_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="主题色">
          <el-color-picker
            :model-value="item.props.theme"
            @update:model-value="updateTheme"
          />
        </el-form-item>
      </el-form>
      <el-button type="danger" plain class="panel-remove" @click="emit('remove')">
        删除当前卡片
      </el-button>
    </template>
    <el-empty v-else description="点击画布中的卡片编辑属性" :image-size="72" />
  </div>
</template>

<script lang="ts">
export default { name: "PropertyPanel" };
</script>
<script lang="ts" setup>
import { CHART_TYPE_OPTIONS, type CardItem, type CardProps, type ChartType } from "../types";

defineProps<{ item: CardItem | null }>();

const emit = defineEmits<{
  (e: "update", patch: Partial<CardProps>): void;
  (e: "remove"): void;
}>();

const updateTitle = (value: unknown) => emit("update", { title: String(value ?? "") });
const updateChartType = (value: unknown) =>
  emit("update", { chartType: value as ChartType });
const updateTheme = (value: unknown) =>
  emit("update", { theme: typeof value === "string" ? value : "#5470c6" });
</script>

<style lang="scss" scoped>
.property-panel {
  box-sizing: border-box;
  height: 100%;
  padding: 16px;
  overflow: auto;
  background-color: #fff;
  border-radius: 4px;
}

.panel-title {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
}

.panel-remove {
  width: 100%;
}
</style>
