import {
  fetchEventSource,
  type EventSourceMessage,
} from "@microsoft/fetch-event-source";

export function sendMessage(
  data: {
    messages: any[];
    sessionId: string;
    model?: string;
  },
  signal: AbortSignal,
  option: {
    onmessage: (event: EventSourceMessage) => void;
    onerror?: (err: Error) => void;
  },
) {
  // 构造带 system prompt 的消息列表，引导模型返回建议格式
  const systemMessage = {
    id: crypto.randomUUID(),
    role: "system" as const,
    content: `你是一个智能助手，回复要简洁清晰。

当你需要向用户展示可点击的推荐建议时，请用以下 markdown 代码块格式嵌入回复中：

\`\`\`suggestions
[{"label":"建议文字","action":"send","value":"点击后自动发送的对话文本"}]
\`\`\`

规则：
- action 为 "send" → 点击后自动发送 value 中的文本继续对话
- action 为 "navigate" → 点击后跳转网页
- action 为 "copy" → 点击后复制 value 到剪贴板
- label 要简洁友好，建议 2~8 个字
- 如果没有建议要展示，不要输出这个代码块
- 建议代码块可以出现在回复的任何位置，不影响其它内容`,
  };

  return fetchEventSource("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: data.model,
      messages: [systemMessage, ...data.messages],
      sessionId: data.sessionId,
      stream: true,
      max_tokens: 4096,
    }),
    signal,
    onmessage: option.onmessage,
    onerror: option.onerror,
  });
}
