// 消息角色
export type Role = "user" | "assistant" | "system";

// 多模态内容块类型
export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image_url";
  image_url: {
    url: string; // base64 或 OSS 链接
    detail?: "low" | "high" | "auto";
  };
}

export interface AudioContent {
  type: "audio";
  audio_url: string;
  transcript?: string; // 语音转文字结果
}

// 文件内容块
// 注意：大部分多模态模型不支持直接发送文件，
// 此类型用于前端展示和后端自定义处理，
// 最终发送给 API 时需适配为文本引用格式
export interface FileContent {
  type: "file";
  file_data: string; // base64 data URL
  filename: string; // 原始文件名
  mime_type: string; // MIME 类型
  file_size: number; // 文件大小（字节）
}

// 联合类型：一条消息可包含多种内容
export type ContentBlock =
  | TextContent
  | ImageContent
  | AudioContent
  | FileContent;

// 消息实体
export interface ChatMessage {
  id: string;
  role: Role;
  content: ContentBlock[]; // ⭐ 关键：使用数组而非纯字符串
  timestamp: number;
  status: "sending" | "streaming" | "done" | "error";
  model?: string;
}

// 会话实体
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}
