<template>
  <div :class="['message-bubble', message.role]">
    <template v-for="(block, idx) in message.content" :key="idx">
      <MarkdownRenderer v-if="block.type === 'text'" :content="block.text" />
      <div v-else-if="block.type === 'image_url'" class="message-image">
        <img
          :src="block.image_url.url"
          alt="用户图片"
          @click="previewImage(block.image_url.url)"
        />
      </div>
      <div
        v-else-if="block.type === 'file'"
        class="message-file"
        @click="downloadFile(block)"
      >
        <div class="file-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div class="file-info">
          <span class="file-name">{{ block.filename }}</span>
          <span class="file-size">{{ formatFileSize(block.file_size) }}</span>
        </div>
        <div class="file-download">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
export default { name: "MessageBubble" };
</script>
<script lang="ts" setup>
import type { ChatMessage, FileContent } from "@/types/chat";
import MarkdownRenderer from "./MarkdownRenderer.vue";

const props = defineProps<{ message: ChatMessage }>();

function previewImage(url: string) {
  window.open(url, "_blank");
}

function downloadFile(file: FileContent) {
  const a = document.createElement("a");
  a.href = file.file_data;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
</script>

<style lang="scss" scoped>
.message-bubble {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 12px;
  margin: 6px 0;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  position: relative;
}

.user {
  align-self: flex-end;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.15);

  // 气泡内代码适配蓝色背景
  :deep(.markdown-body :not(pre) > code) {
    color: inherit;
    background: rgba(255, 255, 255, 0.18);
  }
}

.assistant {
  color: #1a1a1a;
}

.message-image {
  max-width: 280px;
  border-radius: 8px;
  overflow: hidden;
  margin: 4px 0;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: opacity 0.2s;

  img {
    width: 100%;
    height: auto;
    display: block;
  }

  &:hover {
    opacity: 0.9;
  }
}

.message-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 4px 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  max-width: 280px;

  .file-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.18);
    border-radius: 6px;
  }

  .file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .file-name {
      font-size: 13px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      font-size: 11px;
      opacity: 0.65;
    }
  }

  .file-download {
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.15s;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.4);

    .file-download {
      opacity: 1;
    }
  }
}

// assistant 消息的文件
.assistant .message-file {
  border-color: #e8e8e8;
  background: #fafafa;

  .file-icon {
    color: #1677ff;
    background: #e6f4ff;
  }

  .file-name {
    color: #1a1a1a;
  }

  .file-size {
    color: #999;
  }

  .file-download {
    color: #666;
  }

  &:hover {
    background: #f0f0f0;
    border-color: #d0d0d0;
  }
}
</style>
