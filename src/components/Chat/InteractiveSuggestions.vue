<template>
  <div class="suggestions-wrapper">
    <div class="suggestions-label">推荐操作</div>
    <div class="suggestions-list">
      <button
        v-for="(item, i) in items"
        :key="i"
        class="suggestion-chip"
        :class="'action-' + item.action"
        @click="handleClick(item)"
      >
        <span v-if="item.icon" class="chip-icon">{{ item.icon }}</span>
        <span class="chip-label">{{ item.label }}</span>
        <span class="chip-hint">{{ actionHint(item.action) }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "InteractiveSuggestions" };
</script>
<script lang="ts" setup>
import type { SuggestionItem } from "@/types/chat";

defineProps<{ items: SuggestionItem[] }>();

const emit = defineEmits<{
  quickSend: [value: string];
  navigate: [value: string];
  copy: [value: string];
  command: [value: string];
}>();

function handleClick(item: SuggestionItem) {
  switch (item.action) {
    case "send":
      emit("quickSend", item.value);
      break;
    case "navigate":
      emit("navigate", item.value);
      break;
    case "copy":
      navigator.clipboard.writeText(item.value);
      emit("copy", item.value);
      break;
    case "command":
      emit("command", item.value);
      break;
  }
}

function actionHint(action: string): string {
  const hints: Record<string, string> = {
    send: "发送",
    navigate: "跳转",
    copy: "复制",
    command: "执行",
  };
  return hints[action] || "";
}
</script>

<style lang="scss" scoped>
$primary: #1677ff;
$primary-bg: #e6f4ff;
$success: #52c41a;
$success-bg: #f6ffed;
$warning: #faad14;
$warning-bg: #fffbe6;
$text-primary: #1a1a1a;
$text-secondary: #666666;

.suggestions-wrapper {
  margin: 8px 0 4px;

  .suggestions-label {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 6px;
    font-weight: 500;
  }

  .suggestions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .suggestion-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 16px;
    background: #fafafa;
    color: $text-primary;
    cursor: pointer;
    font-size: 13px;
    line-height: 1.4;
    transition: all 0.15s ease;
    white-space: nowrap;

    .chip-icon {
      font-size: 14px;
    }

    .chip-hint {
      font-size: 10px;
      opacity: 0.5;
      margin-left: 2px;
    }

    &:hover {
      border-color: $primary;
      background: $primary-bg;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(22, 119, 255, 0.12);
    }

    &:active {
      transform: translateY(0);
    }

    // 各 action 类型 hover 不同颜色
    &.action-send:hover {
      border-color: $primary;
      background: $primary-bg;
    }

    &.action-navigate:hover {
      border-color: $success;
      background: $success-bg;
    }

    &.action-copy:hover {
      border-color: $warning;
      background: $warning-bg;
    }
  }
}
</style>
