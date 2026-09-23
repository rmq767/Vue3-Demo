// ════════════════════════════════════════════════════════════════
// Agent Demo — 专用类型定义（不污染 src/types/chat.ts）
// ════════════════════════════════════════════════════════════════

/** 演示表单数据模型 */
export interface TaskFormModel {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  agree: boolean;
}

/** 工具调用指令 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

/** 工具执行结果 */
export interface ToolResult {
  ok: boolean;
  message: string;
  /** 表单字段变更（用于高亮反馈） */
  patch?: Partial<TaskFormModel>;
}

/** Agent 执行步骤类型 */
export type StepKind =
  | "thought"
  | "tool_call"
  | "tool_result"
  | "final"
  | "error";

/** Agent 执行步骤 */
export interface AgentStep {
  id: string;
  kind: StepKind;
  timestamp: number;
  /** 思考文本 / 工具名 / 结果描述 */
  content: string;
  /** kind=tool_call 时的工具调用详情 */
  toolCall?: ToolCall;
  /** kind=tool_result 时的执行结果 */
  toolResult?: ToolResult;
}

/** Agent 运行状态 */
export type AgentStatus =
  | "idle"
  | "thinking"
  | "executing"
  | "done"
  | "error"
  | "aborted";

/** 文档生成 Agent 的数据模型 */
export interface DocModel {
  /** 文档标题 */
  title: string;
  /** 保存到桌面的文件名（含 .md 后缀） */
  filename: string;
  /** Markdown 正文 */
  content: string;
  /** 最近一次成功保存的绝对路径 */
  savedPath: string;
  /** 是否正在保存（后端写入中） */
  saving: boolean;
}

/** Agent 模式：表单填写 / 文档生成 */
export type AgentMode = "form" | "doc";

/** 工具执行上下文（不同 Agent 使用各自需要的字段） */
export interface ToolContext {
  formModel?: TaskFormModel;
  docModel?: DocModel;
}

/** 工具定义（JSON Schema 描述 + 执行函数，支持同步或异步） */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (
    args: Record<string, any>,
    ctx: ToolContext,
  ) => ToolResult | Promise<ToolResult>;
}

/**
 * Agent Profile —— 一套可插拔的 Agent 能力描述。
 * useAgent 只依赖此接口，因此新增 Agent 只需提供一个 Profile。
 */
export interface AgentProfile {
  mode: AgentMode;
  /** 构建该 Agent 的 system prompt */
  buildSystemPrompt: () => string;
  /** 执行工具调用（统一返回 Promise） */
  executeTool: (name: string, args: Record<string, any>) => Promise<ToolResult>;
}

/** Agent Loop 中使用的消息格式 */
export interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
