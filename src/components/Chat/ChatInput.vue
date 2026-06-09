<template>
  <div
    class="chat-input-container"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="handleDrop"
    :class="{ 'is-dragover': dragOver }"
  >
    <!-- ─── 附件预览区 ─── -->
    <div v-if="attachments.length" class="attachments-preview">
      <div
        v-for="(att, i) in attachments"
        :key="i"
        class="attachment-item"
        :class="att.type"
      >
        <template v-if="att.type === 'image'">
          <img :src="att.preview" class="attachment-thumb" />
        </template>
        <template v-else>
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
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span class="file-name">{{ att.file.name }}</span>
        </template>
        <button class="remove-btn" @click="removeAttachment(i)">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ─── 输入区域 ─── -->
    <div class="input-area" ref="inputAreaRef">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="input-textarea"
        placeholder="输入消息，或粘贴图片…"
        @keydown.enter.exact.prevent="handleSend"
        @paste="handlePaste"
        rows="3"
      ></textarea>
    </div>

    <!-- ─── 底部工具栏 ─── -->
    <div class="toolbar">
      <div class="toolbar-actions">
        <button
          class="tool-btn"
          title="上传图片"
          @click="triggerUpload('image')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>图片</span>
        </button>
        <button
          class="tool-btn"
          title="上传文件"
          @click="triggerUpload('file')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
            />
          </svg>
          <span>文件</span>
        </button>
      </div>
      <button
        class="send-btn"
        :disabled="!canSend"
        @click="handleSend"
        v-if="!props.isStreaming"
      >
        <span>发送</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
      <el-button
        type="primary"
        class="send-btn"
        :icon="Close"
        circle
        v-else
        @click="close"
      />
    </div>

    <!-- ─── 隐藏的文件拾取器 ─── -->
    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="handleFileSelected('image', $event)"
    />
    <input
      ref="fileInputRef"
      type="file"
      multiple
      style="display: none"
      @change="handleFileSelected('file', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from "vue";
import type { ContentBlock } from "@/types/chat";
import { Close } from "@element-plus/icons-vue";
import { useAttachments } from "@/utils/chat-hooks";

const props = defineProps<{
  isStreaming: boolean;
}>();

const {
  attachments,
  dragOver,
  imageInputRef,
  fileInputRef,
  triggerUpload,
  handleFileSelected,
  handlePaste,
  handleDrop,
  removeAttachment,
  clearAttachments,
  compressImage,
  fileToBase64,
} = useAttachments();

const inputText = ref("");
const textareaRef = ref<HTMLTextAreaElement>();
const inputAreaRef = ref<HTMLDivElement>();

const emit = defineEmits<{
  send: [content: ContentBlock[]];
  close: [];
}>();

const canSend = computed(
  () => inputText.value.trim() !== "" || attachments.value.length > 0,
);

// ─── 发送 ─────────────────────────────────────

async function handleSend() {
  const blocks: ContentBlock[] = [];

  for (const att of attachments.value) {
    if (att.type === "image") {
      const base64 = await compressImage(att.file);
      blocks.push({
        type: "image_url",
        image_url: { url: base64 },
      });
    } else {
      const base64 = await fileToBase64(att.file);
      blocks.push({
        type: "file",
        file_data: base64,
        filename: att.file.name,
        mime_type: att.file.type,
        file_size: att.file.size,
      });
    }
  }

  if (inputText.value.trim()) {
    blocks.push({ type: "text", text: inputText.value });
  }

  if (blocks.length === 0) return;

  emit("send", blocks);

  clearAttachments();
  inputText.value = "";

  await nextTick();
  textareaRef.value?.focus();
}

function close() {
  emit("close");
}
</script>

<style lang="scss" scoped>
$primary: #1677ff;
$primary-light: #e6f4ff;
$bg-card: #ffffff;
$border-color: #e8e8e8;
$text-primary: #1a1a1a;
$text-secondary: #666666;
$text-muted: #999999;

.chat-input-container {
  margin: 0 18%;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid $border-color;
  transition: all 0.2s;
  position: relative;

  &.is-dragover {
    &::before {
      content: "释放以上传文件";
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(22, 119, 255, 0.06);
      border: 2px dashed $primary;
      border-radius: 12px;
      font-size: 15px;
      color: $primary;
      z-index: 10;
      backdrop-filter: blur(4px);
    }
  }

  // ─── 附件预览区 ───────────────────────────
  .attachments-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 0 10px;
  }

  .attachment-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px 4px 4px;
    border: 1px solid $border-color;
    border-radius: 8px;
    background: #fafafa;
    position: relative;
    transition: all 0.15s;

    &:hover {
      border-color: #d0d0d0;
      background: #f0f0f0;
    }

    &.image {
      padding: 2px;
    }

    .attachment-thumb {
      width: 44px;
      height: 44px;
      object-fit: cover;
      border-radius: 6px;
    }

    .file-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary;
      background: $primary-light;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .file-name {
      font-size: 12px;
      color: $text-secondary;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .remove-btn {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: $text-muted;
      cursor: pointer;
      border-radius: 50%;
      flex-shrink: 0;
      transition: all 0.15s;

      &:hover {
        color: #ff4d4f;
        background: rgba(255, 77, 79, 0.1);
      }
    }
  }

  // ─── 输入区域 ─────────────────────────────
  .input-area {
    position: relative;

    .input-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid $border-color;
      border-radius: 12px;
      font-size: 15px;
      line-height: 1.6;
      color: $text-primary;
      background: #f8f8f8;
      resize: none;
      outline: none;
      transition: all 0.2s;
      box-sizing: border-box;
      font-family: inherit;

      &::placeholder {
        color: #bfbfbf;
      }

      &:focus {
        border-color: $primary;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.1);
      }
    }
  }

  // ─── 底部工具栏 ───────────────────────────
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
  }

  .toolbar-actions {
    display: flex;
    gap: 4px;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: none;
    background: transparent;
    color: $text-secondary;
    cursor: pointer;
    border-radius: 8px;
    font-size: 13px;
    transition: all 0.15s;

    svg {
      flex-shrink: 0;
    }

    &:hover {
      background: #f0f0f0;
      color: $text-primary;
    }

    &:active {
      background: #e8e8e8;
    }
  }

  .send-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    border: none;
    background: $primary;
    color: #fff;
    cursor: pointer;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;

    &:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(22, 119, 255, 0.35);
    }

    &:not(:disabled):active {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }
}
</style>
