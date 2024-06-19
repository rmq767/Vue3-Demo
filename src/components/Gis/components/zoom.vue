<template>
  <div class="btn-group-zoom">
    <el-button
      type="primary"
      size="small"
      :icon="Plus"
      @click="zoom('zoomIn')"
    />
    <el-button
      type="primary"
      size="small"
      :icon="Minus"
      @click="zoom('zoomOut')"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'GisZoom' };
</script>
<script lang="ts" setup>
import { Plus, Minus } from '@element-plus/icons-vue';
const emits = defineEmits(['zoom']);
const zoom = (type: 'zoomIn' | 'zoomOut') => {
  emits('zoom', type);
};
</script>

<style lang="scss" scoped>
.btn-group-zoom {
  display: flex;
  // flex-direction: column;

  .el-button + .el-button {
    margin-left: 0;
  }
  .el-button {
    border-radius: 0;
    height: 100%;
    width: 32px;
    padding: 4px;
    &:first-of-type {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    &:last-of-type {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
}
:deep(.el-button) {
  background-color: rgba(27, 27, 27, 0.8);
  border-color: var(--el-color-primary);
  color: #fff;
  .el-icon {
    font-size: 16px;
  }
  &:hover {
    color: var(--el-color-primary);
  }
}
</style>
