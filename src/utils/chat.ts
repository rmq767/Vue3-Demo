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
  return fetchEventSource("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: data.model,
      messages: data.messages,
      sessionId: data.sessionId,
      stream: true,
      max_tokens: 4096,
    }),
    signal,
    onmessage: option.onmessage,
    onerror: option.onerror,
  });
}
