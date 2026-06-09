<template>
  <div class="session" :class="{ 'is-sidebar-open': !isSidebarOpen }">
    <div class="session-inner">
      <div class="session-header">
        <span>DeepDuck</span>
        <el-icon @click="toggleSidebar"><Fold /></el-icon>
      </div>
      <el-button type="primary" size="large" @click="createNewSession"
        >开启新对话</el-button
      >
      <el-divider direction="horizontal" content-position="left"
        >会话列表</el-divider
      >

      <div class="session-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === activeSessionId }"
          @click="getSessionData(session.id)"
        >
          <span class="session-title">{{ session.title }}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="expand" v-if="isSidebarOpen">
    <el-icon @click="toggleSidebar"><Expand /></el-icon>
  </div>
</template>

<script lang="ts">
export default { name: "ChatSession" };
</script>
<script lang="ts" setup>
import type { ChatSession } from "@/types/chat";
import { Fold, Expand } from "@element-plus/icons-vue";
import { ref } from "vue";

const props = withDefaults(
  defineProps<{ sessions: ChatSession[]; activeSessionId: string }>(),
  { sessions: () => [], activeSessionId: "" },
);
const isSidebarOpen = ref(false);
const emit = defineEmits(["getSessionId", "createSession"]);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
const getSessionData = (id: string) => {
  emit("getSessionId", id);
};
const createNewSession = () => {
  emit("createSession");
};
</script>

<style lang="scss" scoped>
$sidebar-width: 240px;
$primary: #1677ff;
$bg-page: #fefefe;
$border: #e8e8e8;
$text-primary: #1a1a1a;

// ─── 会话侧边栏 ───────────────────────────────────
.session {
  // 外层：只控制宽度 + 裁剪，不参与内容布局
  width: 0;
  overflow: hidden;
  transition: width 0.28s ease;
  flex-shrink: 0;
  background-color: $bg-page;
  border-right: 1px solid $border;

  &.is-sidebar-open {
    width: $sidebar-width;
  }
}

.session-inner {
  // 内层：固定宽度，永不压缩
  width: $sidebar-width;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .session-header {
    padding: 18px 20px 14px;
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
    border-bottom: 1px solid #f0f0f0;
    user-select: none;
    display: flex;
    justify-content: space-between;
  }

  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px 0;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #d9d9d9;
      border-radius: 2px;
    }
  }

  .session-item {
    padding: 12px 20px;
    cursor: pointer;
    font-size: 13px;
    color: $text-primary;
    transition: all 0.18s ease;
    border-left: 3px solid transparent;
    position: relative;
    display: flex;
    align-items: center;

    .session-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;
    }

    &:hover {
      background-color: #f5f5f5;
    }

    &.active {
      background-color: #e6f4ff;
      border-left-color: $primary;
      color: $primary;
      font-weight: 500;

      .session-title {
        color: $primary;
      }
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 1px;
      background-color: #f0f0f0;
    }
    &:last-child::after {
      display: none;
    }
  }
}

.el-icon {
  cursor: pointer;
}
</style>
