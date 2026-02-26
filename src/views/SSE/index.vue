<template>
  <div class="chat-container">
    <div class="chat-header">
      <h5>仿 ChatGPT 流式对话</h5>
    </div>
    <!-- 对话消息列表 -->
    <div class="chat-messages" ref="messagesRef">
      <div
        class="message-item"
        :class="{
          'user-message': item.role === 'user',
          'ai-message': item.role === 'assistant',
        }"
        v-for="item in messageList"
        :key="item.id"
      >
        <div class="message-role">{{ item.role === "user" ? "我" : "AI" }}</div>
        <div class="message-content">
          <div v-if="item.role === 'assistant'" v-html="renderMarkdown(item.content)"></div>
          <div v-else>{{ item.content }}</div>
        </div>
      </div>
    </div>
    <!-- 输入和操作区域 -->
    <div class="chat-footer">
      <div class="input-wrapper">
        <input
          type="text"
          v-model="userInput"
          placeholder="请输入你的问题..."
          @keyup.enter="sendMessage"
          :disabled="isStreaming"
        />
        <button
          @click="sendMessage"
          class="send-btn"
          :disabled="!userInput.trim() || isStreaming"
        >
          发送
        </button>
      </div>
      <div class="btns">
        <button @click="stopEvent" :disabled="!isStreaming">停止回复</button>
        <button @click="clearEvent">清空对话</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { startStream } from "@/utils/fetch-event-source";
import { marked } from "marked";
import DOMPurify from "dompurify";

// 配置marked
marked.setOptions({
  breaks: true, // 支持换行符
  gfm: true, // 启用GitHub风格Markdown
});

// 核心数据定义
const messageList = ref([]); // 对话消息列表，存储所有用户/AI消息
const userInput = ref(""); // 用户输入框内容
const isStreaming = ref(false); // 是否正在流式输出（防止重复发送请求）
const messagesRef = ref(null); // 消息区域DOM引用（用于自动滚动）
let currentStreamInstance = null; // 当前流式连接实例（用于停止连接）
let currentAIMessageId = null; // 当前正在回复的AI消息ID（用于更新流式内容）

/**
 * 渲染Markdown内容
 * @param content - 原始Markdown文本
 * @returns 渲染后的HTML
 */
const renderMarkdown = (content) => {
  if (!content) return "";
  try {
    const html = marked.parse(content);
    // 使用DOMPurify清理HTML，防止XSS攻击
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error("Markdown渲染错误:", error);
    return content;
  }
};

/**
 * 发送消息（核心对话功能）
 */
const sendMessage = () => {
  // 校验输入：去除空格后为空则不发送
  const inputContent = userInput.value.trim();
  if (!inputContent || isStreaming.value) return;

  // 1. 添加用户消息到列表
  const userMessage = {
    id: Date.now().toString(), // 简单生成唯一ID（生产环境可使用uuid）
    role: "user", // 消息角色：user（用户）/ assistant（AI）
    content: inputContent,
  };
  messageList.value.push(userMessage);

  // 2. 初始化AI消息（用于后续流式追加内容）
  currentAIMessageId = Date.now() + 1 + "";
  const aiMessage = {
    id: currentAIMessageId,
    role: "assistant",
    content: "", // 初始内容为空，后续流式更新
  };
  messageList.value.push(aiMessage);

  // 3. 清空输入框并标记为流式中
  userInput.value = "";
  isStreaming.value = true;

  // 4. 自动滚动到底部（显示最新消息）
  scrollToBottom();

  // 5. 启动流式请求
  currentStreamInstance = startStream(
    "http://localhost:3000/api/getReqText",
    inputContent, // 把用户输入传递给后端
    {
      onmessage(event) {
        // 找到当前正在回复的AI消息，追加流式内容
        const targetAIMessage = messageList.value.find(
          (item) => item.id === currentAIMessageId,
        );
        if (targetAIMessage) {
          const messageData = JSON.parse(event.data);
          targetAIMessage.content += messageData.text;
          if (messageData.end) {
            resetStreamingStatus();
          }
          // 每接收一段内容，自动滚动到底部
          scrollToBottom();
        }
      },
      onclose() {
        // 流式连接关闭，重置状态
        resetStreamingStatus();
      },
      onerror() {
        // 流式请求出错，重置状态并提示
        const targetAIMessage = messageList.value.find(
          (item) => item.id === currentAIMessageId,
        );
        if (targetAIMessage) {
          targetAIMessage.content += "\n\n【出错了：流式连接中断】";
        }
        resetStreamingStatus();
      },
    },
  );
};

/**
 * 停止AI流式回复
 */
const stopEvent = () => {
  if (
    currentStreamInstance &&
    typeof currentStreamInstance.close === "function"
  ) {
    currentStreamInstance.close(); // 关闭流式连接
  }
  resetStreamingStatus();
};

/**
 * 清空所有对话
 */
const clearEvent = () => {
  // 如果正在流式输出，先停止连接
  if (isStreaming.value) {
    stopEvent();
  }
  messageList.value = []; // 清空消息列表
  currentAIMessageId = null;
};

/**
 * 重置流式状态
 */
const resetStreamingStatus = () => {
  isStreaming.value = false;
  currentStreamInstance = null;
  currentAIMessageId = null;
};

/**
 * 自动滚动到消息列表底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};
</script>

<style scoped>
.chat-container {
  width: 100vw;
  height: 100vh;
  max-width: none;
  margin: 0;
  background: linear-gradient(135deg, #23272f 60%, #2e335a 100%);
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: none;
}

.chat-container * {
  outline: none;
  box-sizing: border-box;
}

.chat-header {
  padding: 24px 32px 16px 32px;
  border-bottom: 1.5px solid #2e335a;
  background: rgba(30, 34, 54, 0.92);
  border-radius: 0;
  text-align: center;
}

.chat-header h5 {
  margin: 0;
  font-size: 1.25em;
  font-weight: 700;
  letter-spacing: 1px;
  color: #7ec4fa;
  text-shadow: 0 2px 8px #1a1a2a44;
}

.chat-messages {
  flex: 1;
  overflow: auto;
  padding: 24px 32px;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #7ec4fa #23272f;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #7ec4fa88;
  border-radius: 4px;
}

/* 消息项通用样式 */
.message-item {
  display: flex;
  gap: 12px;
  max-width: 80%; /* 限制消息宽度，贴近ChatGPT */
}

/* 用户消息样式（右侧对齐） */
.user-message {
  align-self: flex-end;
  flex-direction: row-reverse; /* 角色和内容反转 */
}

/* AI消息样式（左侧对齐） */
.ai-message {
  align-self: flex-start;
}

/* 消息角色标签 */
.message-role {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2e335a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  flex-shrink: 0; /* 防止被压缩 */
}

.user-message .message-role {
  background: #7ec4fa;
  color: #23272f;
}

/* 消息内容容器 */
.message-content {
  padding: 16px 20px;
  border-radius: 16px;
  line-height: 1.6;
  font-size: 1em;
  word-break: break-all; /* 防止长文本溢出 */
  overflow-wrap: break-word;
}

/* Markdown样式 */
.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4),
.message-content :deep(h5),
.message-content :deep(h6) {
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  font-weight: 600;
  color: #f5f5f5;
}

.message-content :deep(p) {
  margin: 0.5em 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.message-content :deep(li) {
  margin: 0.25em 0;
}

.message-content :deep(code) {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 0.9em;
}

.message-content :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.8em 0;
}

.message-content :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.9em;
}

.message-content :deep(blockquote) {
  border-left: 4px solid #7ec4fa;
  margin: 0.8em 0;
  padding-left: 1em;
  color: #e0e0e0;
}

.message-content :deep(a) {
  color: #7ec4fa;
  text-decoration: underline;
}

.message-content :deep(table) {
  border-collapse: collapse;
  margin: 0.8em 0;
  width: 100%;
}

.message-content :deep(th),
.message-content :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5em;
  text-align: left;
}

.message-content :deep(th) {
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
}

.message-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 0.5em 0;
}

.user-message .message-content {
  background: #7ec4fa22;
  color: #fff;
  border-bottom-right-radius: 4px; /* 贴近ChatGPT的圆角细节 */
}

.ai-message .message-content {
  background: #2e335a88;
  color: #f5f5f5;
  border-bottom-left-radius: 4px;
}

/* 底部输入和操作区域 */
.chat-footer {
  padding: 20px 32px;
  background: rgba(30, 34, 54, 0.92);
  border-top: 1.5px solid #2e335a;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 输入框包装 */
.input-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper input {
  flex: 1;
  padding: 16px 20px;
  border-radius: 24px;
  border: 1.5px solid #2e335a;
  background: #23272f;
  color: #fff;
  font-size: 1em;
}

.input-wrapper input:disabled {
  background: #23272f88;
  cursor: not-allowed;
  color: #999;
}

.input-wrapper .send-btn {
  padding: 0 24px;
  border-radius: 24px;
  border: none;
  background: #7ec4fa;
  color: #23272f;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.input-wrapper .send-btn:disabled {
  background: #7ec4fa88;
  cursor: not-allowed;
}

.input-wrapper .send-btn:hover:not(:disabled) {
  background: #6bb9f8;
}

/* 操作按钮组 */
.btns {
  display: flex;
  gap: 18px;
  justify-content: center;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.btns button {
  padding: 12px 24px;
  border-radius: 24px;
  border: 1.5px solid #d1d5db;
  background: #282c42;
  color: #fff;
  font-weight: 500;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.18s;
}

.btns button:disabled {
  background: #282c4288;
  color: #999;
  cursor: not-allowed;
  border-color: #d1d5db88;
}

.btns button:hover:not(:disabled) {
  background: #ededed;
  border: 1.5px solid #bdbdbd;
  color: #222;
}
</style>

