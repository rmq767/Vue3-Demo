<template>
  <div class="chat">
    <ChatSession
      :sessions="sessions"
      :activeSessionId="activeSessionId"
      @getSessionId="handleSelectSession"
      @createSession="handleClearSession"
    />
    <div class="main">
      <div class="messages-area">
        <template v-if="messagesLoading && !messageList.length">
          <div class="loading-state">
            <div class="loading-spinner"></div>
          </div>
        </template>
        <template v-else>
          <DynamicScroller
            ref="scrollerRef"
            :items="messageList"
            :min-item-size="60"
            class="message-scroller"
          >
            <template #default="{ item, active }">
              <DynamicScrollerItem
                class="message-item"
                :item="item"
                :active="active"
              >
                <MessageBubble :message="item" />
              </DynamicScrollerItem>
            </template>
          </DynamicScroller>
          <div v-if="isStreaming" class="stream-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </template>
      </div>
      <ChatInput
        class="chat-input"
        :isStreaming="isStreaming"
        @send="handleSend"
        @close="handleClose"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default { name: "Text" };
</script>
<script lang="ts" setup>
import MessageBubble from "@/components/Chat/MessageBubble.vue";
import { onMounted } from "vue";
import ChatInput from "@/components/Chat/ChatInput.vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { useRoute } from "vue-router";
import ChatSession from "@/components/Chat/ChatSession.vue";
import { useChatSessions, useChatStream } from "@/utils/chat-hooks";
import type { ContentBlock } from "@/types/chat";

const route = useRoute();

const {
  sessions,
  activeSessionId,
  fetchSessions,
  createSession,
  selectSession,
  clearSession,
} = useChatSessions();

const {
  messageList,
  isStreaming,
  messagesLoading,
  scrollerRef,
  fetchSessionMessages,
  sendMessage,
  clearMessages,
  closeStream,
} = useChatStream(activeSessionId);

// ─── 事件处理 ───────────────────────────────────────────

const handleSend = async (content: ContentBlock[]) => {
  // 从多模态内容中提取文本作为会话标题
  const firstText = content.find((b) => b.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  const title = firstText?.text || "新对话";

  if (!activeSessionId.value) {
    await createSession(title);
  }
  sendMessage(content);
};

const handleSelectSession = (id: string) => {
  selectSession(id);
  fetchSessionMessages(id);
};

const handleClose = () => {
  closeStream();
};
const handleClearSession = () => {
  clearSession();
  clearMessages();
};

// ─── 初始化 ─────────────────────────────────────────────

onMounted(() => {
  fetchSessions();
  if (route.query.id as string) {
    const id = route.query.id as string;
    selectSession(id);
    fetchSessionMessages(id);
  }
});
</script>

<style lang="scss" scoped>
$sidebar-width: 240px;
$primary: #1677ff;
$bg-page: #fefefe;
$bg-white: #ffffff;
$border: #e8e8e8;
$text-primary: #1a1a1a;
$text-secondary: #666666;
$text-muted: #999999;

.chat {
  display: flex;
  height: 100vh;
  background-color: $bg-page;

  // ─── 主消息区域 ───────────────────────────────────
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: $bg-white;
    min-width: 0;

    .messages-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;

      .message-scroller {
        flex: 1;
        width: calc(100% - 36%);
        align-self: center;
        overscroll-behavior: contain;
        padding: 16px 18%;

        :deep(.vue-recycle-scroller__item-view) {
          display: flex;
        }

        &::-webkit-scrollbar {
          width: 6px;
        }
        &::-webkit-scrollbar-track {
          background: transparent;
        }
        &::-webkit-scrollbar-thumb {
          background-color: #d9d9d9;
          border-radius: 3px;
          &:hover {
            background-color: #bfbfbf;
          }
        }
      }

      // ── Loading 加载中 ─────────────────────────
      .loading-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;

        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #e8e8e8;
          border-top-color: $primary;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      }

      // ── AI 正在输入指示器 ──────────────────────
      .stream-indicator {
        padding: 8px 18%;
        display: flex;
        align-items: center;
        gap: 5px;

        .typing-dot {
          width: 6px;
          height: 6px;
          background: $primary;
          border-radius: 50%;
          animation: typing-bounce 1.4s ease-in-out infinite;

          &:nth-child(2) {
            animation-delay: 0.2s;
          }
          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }
  }
}
:deep(.vue-recycle-scroller__item-view) {
  &:has(.user) {
    justify-content: flex-end;
  }
  &:has(.assistant) {
    justify-content: flex-start;
  }
}
// 每个消息项的内部容器
:deep(.message-item) {
  &:has(.assistant) {
    width: 100%;
  }
}
:deep(.user) {
  padding: 5px 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
