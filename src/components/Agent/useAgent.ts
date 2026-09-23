import { ref, type Ref } from "vue";
import type {
  AgentMessage,
  AgentProfile,
  AgentStatus,
  AgentStep,
  ToolCall,
  ToolResult,
} from "./types";
import { runAgentTurn } from "./agentStream";

// ════════════════════════════════════════════════════════════════
// Agent Loop 组合式函数
// ════════════════════════════════════════════════════════════════

const MAX_ITER = 8;
const TOOL_CALL_REGEX = /```tool_call\s*\n([\s\S]*?)\n\s*```/g;

function generateId(): string {
  return crypto.randomUUID();
}

/** 从 LLM 回复中解析 tool_call 代码块 */
function parseToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(TOOL_CALL_REGEX.source, "g");

  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.name) {
        calls.push({
          id: generateId(),
          name: parsed.name,
          arguments: parsed.arguments || {},
        });
      }
    } catch {
      // JSON 解析失败，跳过
    }
  }

  return calls;
}

/** 去除 tool_call 代码块，保留思考文本 */
function stripToolCallBlocks(text: string): string {
  return text.replace(TOOL_CALL_REGEX, "").trim();
}

export function useAgent(getProfile: () => AgentProfile) {
  const steps: Ref<AgentStep[]> = ref([]);
  const status: Ref<AgentStatus> = ref("idle");
  const currentThought = ref("");

  let abortController: AbortController | null = null;
  let aborted = false;

  /** 添加一个执行步骤 */
  function pushStep(step: Omit<AgentStep, "id" | "timestamp">) {
    steps.value.push({
      ...step,
      id: generateId(),
      timestamp: Date.now(),
    });
  }

  /** 执行单轮 LLM 调用，返回 Promise<完整回复文本> */
  function callLLM(messages: AgentMessage[]): Promise<string> {
    return new Promise((resolve, reject) => {
      currentThought.value = "";

      runAgentTurn({
        messages,
        signal: abortController!.signal,
        onToken(token: string) {
          currentThought.value += token;
        },
        onDone(fullText: string) {
          resolve(fullText);
        },
        onError(err: Error) {
          reject(err);
        },
      });
    });
  }

  /** 执行工具调用并记录步骤 */
  async function executeToolCall(
    toolCall: ToolCall,
    profile: AgentProfile,
  ): Promise<ToolResult> {
    // 记录工具调用步骤
    pushStep({
      kind: "tool_call",
      content: `${toolCall.name}(${JSON.stringify(toolCall.arguments)})`,
      toolCall,
    });

    // 执行工具（可能为异步，如写文件到桌面）
    const result = await profile.executeTool(toolCall.name, toolCall.arguments);

    // 记录工具结果步骤
    pushStep({
      kind: result.ok ? "tool_result" : "error",
      content: result.message,
      toolResult: result,
    });

    return result;
  }

  /** 主 Agent Loop */
  async function run(task: string): Promise<void> {
    // 重置状态
    reset();
    status.value = "thinking";
    aborted = false;
    abortController = new AbortController();

    // 获取当前 Agent Profile（由调用方根据模式切换提供）
    const profile = getProfile();

    // 初始化消息列表
    const messages: AgentMessage[] = [
      { role: "system", content: profile.buildSystemPrompt() },
      { role: "user", content: task },
    ];

    let iteration = 0;

    try {
      while (iteration < MAX_ITER && !aborted) {
        iteration++;

        // 调用 LLM
        const response = await callLLM(messages);

        // 检查是否被中止
        if (aborted) break;

        // 解析思考文本和工具调用
        const thought = stripToolCallBlocks(response);
        const toolCalls = parseToolCalls(response);

        // 记录思考步骤
        if (thought) {
          pushStep({ kind: "thought", content: thought });
        }

        // 将 assistant 回复加入消息历史
        messages.push({ role: "assistant", content: response });

        // 没有工具调用 → 任务结束
        if (toolCalls.length === 0) {
          pushStep({ kind: "final", content: thought || "任务已完成" });
          status.value = "done";
          break;
        }

        // 执行工具调用（每次只执行第一个）
        status.value = "executing";
        const toolCall = toolCalls[0];
        const result = await executeToolCall(toolCall, profile);

        // 检查是否调用了 finish 工具
        if (toolCall.name === "finish") {
          pushStep({ kind: "final", content: result.message });
          status.value = "done";
          break;
        }

        // 将工具结果回灌到消息历史（使用 role: user 以最大兼容）
        messages.push({
          role: "user",
          content: `[TOOL_RESULT] ${JSON.stringify({
            ok: result.ok,
            message: result.message,
          })}`,
        });

        // 继续下一轮思考
        status.value = "thinking";
      }

      // 达到最大轮次
      if (iteration >= MAX_ITER && status.value !== "done") {
        pushStep({
          kind: "error",
          content: `已达到最大执行轮次 (${MAX_ITER})，任务可能未完成`,
        });
        status.value = "error";
      }
    } catch (err: any) {
      if (aborted) return;

      pushStep({
        kind: "error",
        content: `执行出错: ${err.message || String(err)}`,
      });
      status.value = "error";
    }
  }

  /** 中止 Agent 执行 */
  function abort(): void {
    aborted = true;
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    status.value = "aborted";
    pushStep({ kind: "error", content: "用户中止了任务执行" });
  }

  /** 重置 Agent 状态 */
  function reset(): void {
    steps.value = [];
    status.value = "idle";
    currentThought.value = "";
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  return {
    steps,
    status,
    currentThought,
    run,
    abort,
    reset,
  };
}
