import { fetchEventSource } from "@microsoft/fetch-event-source";

export async function startStream(url: string, message: string, option?: any) {
  return fetchEventSource(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer YOUR_TOKEN",
    },
    body: JSON.stringify({ query: message }),
    async onopen(response) {
      // 连接成功时触发
      if (response.ok) return;
      throw new Error("连接失败");
    },
    onmessage:
      option?.onmessage ||
      function (event) {
        // 接收到消息时触发
        console.log("接收到消息:", event.data);
      },

    onclose:
      option?.onclose ||
      function () {
        // 连接关闭时触发
        console.log("连接已关闭");
      },
    onerror:
      option?.onerror ||
      function (err) {
        // 发生错误时触发
        console.error("发生错误:", err);
      },
    ...option,
  });
}

