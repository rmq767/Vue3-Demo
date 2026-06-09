import { ref, watch, type Ref } from "vue";
import { useRouter } from "vue-router";
import {
  getSessionHistory,
  createSessionChat,
  getSessionDetail,
} from "@/api/chat";
import { sendMessage as sendChatMessage } from "@/utils/chat";
import type { ChatMessage, ContentBlock, FileContent } from "@/types/chat";

// ════════════════════════════════════════════════════════════════
// Attachment — 附件类型
// ════════════════════════════════════════════════════════════════

interface Attachment {
  type: "image" | "file";
  file: File;
  preview: string;
}

// ════════════════════════════════════════════════════════════════
// 通用工具
// ════════════════════════════════════════════════════════════════

/** 追加流式 token 到最后一条 assistant 消息的 text block */
function appendStreamToken(lastMsg: any, token: string, messageId: string) {
  lastMsg.id = messageId;
  let textBlock = [...lastMsg.content]
    .reverse()
    .find((b: any) => b.type === "text");
  if (textBlock && textBlock.type === "text") {
    textBlock.text += token;
  } else {
    lastMsg.content.push({ type: "text", text: token });
  }
}

/**
 * 滚动 DynamicScroller 到底部
 *
 * 不依赖 scrollToItem（需要 DynamicScroller 内部缓存的位置数据），
 * 直接在底层 DOM 容器设 scrollTop，浏览器会自动 clamp 到最大值。
 * 同时用 requestAnimationFrame 做一次兜底，等 DynamicScroller
 * 的 ResizeObserver 更新完总高度后再修正一次位置。
 */
function scrollToBottom(scrollerRef: any, _messageList: any[]) {
  const scroller = scrollerRef?.value;
  if (!scroller) return;
  const el: HTMLElement | undefined = scroller.$el;
  if (!el) return;

  // 直接滚到底（浏览器会 clamp 到 scrollHeight 最大值）
  el.scrollTop = el.scrollHeight;

  // 下一帧兜底：等 DynamicScroller 更新完总高度后修正
  requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight;
  });
}

// ════════════════════════════════════════════════════════════════
// useAttachments — 多模态附件管理（上传、粘贴、拖拽、压缩）
// ════════════════════════════════════════════════════════════════

export function useAttachments() {
  const attachments = ref<Attachment[]>([]);
  const dragOver = ref(false);
  const imageInputRef = ref<HTMLInputElement>();
  const fileInputRef = ref<HTMLInputElement>();

  function addFiles(files: File[], defaultType?: "image" | "file") {
    for (const file of files) {
      const type =
        defaultType || (file.type.startsWith("image/") ? "image" : "file");
      const preview = type === "image" ? URL.createObjectURL(file) : "";
      attachments.value.push({ type, file, preview });
    }
  }

  function triggerUpload(type: "image" | "file") {
    if (type === "image") {
      imageInputRef.value?.click();
    } else {
      fileInputRef.value?.click();
    }
  }

  function handleFileSelected(type: "image" | "file", e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    addFiles(Array.from(files), type);
    (e.target as HTMLInputElement).value = "";
  }

  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length) {
      e.preventDefault();
      addFiles(imageFiles, "image");
    }
  }

  function handleDrop(e: DragEvent) {
    dragOver.value = false;
    const files = e.dataTransfer?.files;
    if (files?.length) {
      addFiles(Array.from(files));
    }
  }

  function removeAttachment(index: number) {
    const att = attachments.value[index];
    if (att.preview) URL.revokeObjectURL(att.preview);
    attachments.value.splice(index, 1);
  }

  function clearAttachments() {
    attachments.value.forEach((att) => {
      if (att.preview) URL.revokeObjectURL(att.preview);
    });
    attachments.value = [];
  }

  /** 压缩图片至最大边不超过 maxDimension px，返回 base64 data URL */
  function compressImage(file: File, maxDimension = 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || "image/jpeg", 0.85));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("图片加载失败"));
      };
      img.src = objectUrl;
    });
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return {
    attachments,
    dragOver,
    imageInputRef,
    fileInputRef,
    addFiles,
    triggerUpload,
    handleFileSelected,
    handlePaste,
    handleDrop,
    removeAttachment,
    clearAttachments,
    compressImage,
    fileToBase64,
  };
}

// ════════════════════════════════════════════════════════════════
// useChatSessions — 会话列表管理
// ════════════════════════════════════════════════════════════════

export function useChatSessions() {
  const router = useRouter();
  const sessions = ref<any[]>([]);
  const activeSessionId = ref<string>("");
  const sessionsLoading = ref(false);

  /** 获取会话列表 */
  async function fetchSessions() {
    sessionsLoading.value = true;
    try {
      const res = await getSessionHistory();
      sessions.value = res.data.sessions.filter(
        (_session: any, index: number) => index < 10,
      );
    } finally {
      sessionsLoading.value = false;
    }
  }

  /** 创建新会话 */
  async function createSession(title: string): Promise<string> {
    const res = await createSessionChat(title);
    activeSessionId.value = res.data.session.id;
    router.replace({ query: { id: activeSessionId.value } });
    await fetchSessions();
    return activeSessionId.value;
  }

  /** 选中已有会话 */
  function selectSession(id: string) {
    activeSessionId.value = id;
  }

  /** 清空当前会话（新建对话时） */
  function clearSession() {
    activeSessionId.value = "";
    router.replace({ query: {} });
  }

  return {
    sessions,
    activeSessionId,
    sessionsLoading,
    fetchSessions,
    createSession,
    selectSession,
    clearSession,
  };
}

// ════════════════════════════════════════════════════════════════
// useChatStream — 消息流式处理
// ════════════════════════════════════════════════════════════════

export function useChatStream(activeSessionId: Ref<string>) {
  const messageList = ref<ChatMessage[]>([]);
  const isStreaming = ref(false);
  const messagesLoading = ref(false);
  const scrollerRef = ref<HTMLElement>();
  let abortController: AbortController | null = null;

  // ── 自动滚动到底部 ──────────────────────────────────
  watch(
    () => messageList.value.length,
    () => {
      scrollToBottom(scrollerRef, messageList.value);
    },
  );

  /** 加载指定会话的消息列表 */
  async function fetchSessionMessages(id: string) {
    messageList.value = [];
    messagesLoading.value = true;
    try {
      const res = await getSessionDetail(id);
      messageList.value = res.data.session.messages;
    } finally {
      messagesLoading.value = false;
    }
  }

  /**
   * 将内部 ContentBlock[] 适配为 API 兼容格式。
   * 不同类型的文件按标准多模态格式发送，
   * 让大模型能真正识别文件内容。
   */
  function adaptToAPIFormat(blocks: ContentBlock[]) {
    return blocks.map((block) => {
      if (block.type !== "file") return block;
      const f = block as FileContent;

      // 图片文件 -> image_url 格式（标准多模态输入）
      if (f.mime_type.startsWith("image/")) {
        return {
          type: "image_url" as const,
          image_url: {
            url: f.file_data, // 已经是 base64 data URL
            detail: "auto" as const,
          },
        };
      }

      // 文本文件 -> 解码 base64 后直接发送文本内容
      if (f.mime_type.startsWith("text/")) {
        try {
          const base64Data = f.file_data.includes("base64,")
            ? f.file_data.split("base64,")[1]
            : f.file_data;
          const decoded = atob(base64Data);
          return {
            type: "text" as const,
            text: `[文件内容] ${f.filename}:\n\`\`\`\n${decoded}\n\`\`\``,
          };
        } catch {
          // 解码失败则回退为带文件信息的文本
          return {
            type: "text" as const,
            text: `[文件] ${f.filename} (${f.mime_type}, ${formatFileSize(f.file_size)})`,
          };
        }
      }

      // 其他文件类型（PDF / Word / Excel 等）：
      // 将 base64 数据附在文本中，后端或模型可自行解析
      return {
        type: "text" as const,
        text: `[文件] ${f.filename} (${f.mime_type}, ${formatFileSize(f.file_size)})\n数据: ${f.file_data}`,
      };
    });
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /** 发送多模态消息并处理流式响应 */
  async function sendMessage(content: ContentBlock[]) {
    if (!activeSessionId.value) return;

    const msg: ChatMessage = {
      content, // 保留原始 ContentBlock（含 FileContent）用于前端展示
      id: crypto.randomUUID(),
      role: "user",
      timestamp: Date.now(),
      status: "done",
    };
    messageList.value.push(msg);
    messageList.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: [{ type: "text", text: "" }],
      timestamp: Date.now(),
      status: "streaming",
    });
    isStreaming.value = true;

    // 适配内部格式为 API 兼容格式（仅用于发送给后端）
    const apiContent = adaptToAPIFormat(content);
    // 只发送 role + content，去掉 id/timestamp/status 等额外字段
    const apiMessages = [
      {
        role: "user" as const,
        content: apiContent,
        id: msg.id,
      },
    ];
    abortController = new AbortController();
    sendChatMessage(
      {
        messages: apiMessages,
        sessionId: activeSessionId.value,
        model: "deepseek",
      },
      abortController.signal,
      {
        onerror: (err) => {
          isStreaming.value = false;
          // 出错时也尝试滚动到底部
          scrollToBottom(scrollerRef, messageList.value);
          console.error(err);
        },
        onmessage: (event) => {
          if (event.data.includes("error")) {
            const result = JSON.parse(event.data);
            isStreaming.value = false;
            messageList.value.push({
              id: crypto.randomUUID(),
              role: "assistant",
              content: [{ type: "text", text: result.error }],
              timestamp: Date.now(),
              status: "error",
            });
          }
          if (event.data.includes("sessionId") || event.data === "[DONE]") {
            isStreaming.value = false;
            // 流结束，确保滚动到底部
            scrollToBottom(scrollerRef, messageList.value);
            return;
          }
          try {
            const result = JSON.parse(event.data);
            if (result.token) {
              const lastMsg = messageList.value[messageList.value.length - 1];
              if (lastMsg.role !== "assistant") return;
              appendStreamToken(lastMsg, result.token, result.messageId);
              scrollToBottom(scrollerRef, messageList.value);
            }
          } catch {
            // ignore parse errors
          }
        },
      },
    );
  }

  /** 清空消息列表 */
  function clearMessages() {
    messageList.value = [];
  }

  /** 关闭当前消息流 */
  function closeStream() {
    abortController?.abort();
    abortController = null;
    isStreaming.value = false;
  }

  return {
    messageList,
    isStreaming,
    messagesLoading,
    scrollerRef,
    fetchSessionMessages,
    sendMessage,
    clearMessages,
    closeStream,
  };
}
