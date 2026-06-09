import request from "@/utils/request";

export function createSessionChat(title?: string) {
  return request({
    url: "/api/chat/sessions",
    method: "POST",
    data: { title },
  });
}

export function getSessionHistory() {
  return request({
    url: "/api/chat/sessions",
    method: "GET",
  });
}

export function getSessionDetail(id: string) {
  return request({
    url: `/api/chat/sessions/${id}`,
    method: "GET",
  });
}
