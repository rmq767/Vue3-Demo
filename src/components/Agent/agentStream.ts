import {
  fetchEventSource,
  type EventSourceMessage,
} from "@microsoft/fetch-event-source";
import type { AgentMessage } from "./types";

// ════════════════════════════════════════════════════════════════
// Agent 专用 SSE 调用器（独立于 src/utils/chat.ts，零侵入）
// ════════════════════════════════════════════════════════════════

export interface AgentTurnOptions {
  messages: AgentMessage[];
  signal: AbortSignal;
  model?: string;
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: Error) => void;
}

/**
 * 发送一轮 Agent 请求，流式接收 LLM 回复。
 * 与 src/utils/chat.ts 的区别：
 * - 使用 Agent 专用 system prompt（由调用方在 messages 中提供）
 * - 不含 suggestions 指令
 * - onDone 回调返回完整文本，供上层解析 tool_call 代码块
 */
export function runAgentTurn(options: AgentTurnOptions): void {
  const { messages, signal, model, onToken, onDone, onError } = options;

  let fullText = "";
  let done = false;

  fetchEventSource("http://localhost:3001/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: model || "",
    }),
    signal,
    onmessage(event: EventSourceMessage) {
      if (done) return;

      // 结束标志：event: done 或 [DONE]
      if (event.event === "done" || event.data === "[DONE]") {
        done = true;
        onDone(fullText);
        return;
      }

      try {
        const result = JSON.parse(event.data);

        // 错误处理
        if (result.error) {
          done = true;
          onError(new Error(result.error));
          return;
        }

        // 完成标志（兼容 messageId 字段）
        if (result.messageId && !result.token) {
          done = true;
          onDone(fullText);
          return;
        }

        // 增量 token
        if (result.token) {
          fullText += result.token;
          onToken(result.token);
        }
      } catch {
        // 忽略非 JSON 数据
      }
    },
    onerror(err) {
      if (!done) {
        done = true;
        onError(err instanceof Error ? err : new Error(String(err)));
      }
      // 抛出错误以阻止 fetchEventSource 自动重试
      throw err;
    },
    openWhenHidden: true,
  });
}
