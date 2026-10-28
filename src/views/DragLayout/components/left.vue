<template>
  <div class="left">
    <div class="left-list">
      <div
        v-for="panel in PANELS"
        :key="panel.type"
        class="left-item grid-stack-item"
      >
        <div class="left-item-content grid-stack-item-content">
          <img :src="panel.img" :alt="panel.title" draggable="false" />
          <div class="left-item-bar">
            <span class="left-item-title">{{ panel.title }}</span>
            <el-button
              class="left-item-add"
              type="primary"
              size="small"
              circle
              :icon="Plus"
              @click.stop="emit('add', panel.type)"
            />
          </div>
        </div>
      </div>
    </div>
    <p class="left-tip">拖拽到右侧画布，或点击 + 添加</p>
  </div>
</template>

<script lang="ts">
export default { name: "Left" };
</script>
<script lang="ts" setup>
import { Plus } from "@element-plus/icons-vue";
import { PANELS, type ChartType } from "../types";

const emit = defineEmits<{
  (e: "add", type: ChartType): void;
}>();
</script>

<style lang="scss" scoped>
.left {
  padding: 10px;
  .left-list {
    display: flex;
    flex-wrap: wrap;
  }
  .left-item {
    width: 180px;
    height: 140px;
    margin: 10px;
    overflow: hidden;
    cursor: grab;
    background-color: #fff;
    border-radius: 4px;
    touch-action: none;
    user-select: none;
    &:active {
      cursor: grabbing;
    }
    img {
      width: 100%;
      height: 104px;
      object-fit: cover;
      pointer-events: none;
    }
  }
  .left-item-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .left-item-bar {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    font-size: 13px;
    color: #333;
  }
  .left-tip {
    margin: 10px;
    font-size: 12px;
    color: #666;
  }
}
</style>
