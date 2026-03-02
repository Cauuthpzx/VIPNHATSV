import { api } from "@/api/client";

export function fetchNotificationCount() {
  return api.get<{ success: boolean; data: { unread: number } }>("/notifications/count");
}

export function fetchNotifications(params?: { unread?: string; limit?: number; offset?: number }) {
  return api.get("/notifications", { params });
}

export function markNotificationsRead(data: { ids?: string[]; all?: boolean }) {
  return api.post("/notifications/read", data);
}

export function deleteReadNotifications() {
  return api.delete("/notifications/read");
}

export function deleteAllNotifications() {
  return api.delete("/notifications");
}

export function fetchMemberDetail(agentId: string, username: string) {
  return api.get(`/notifications/member/${encodeURIComponent(agentId)}/${encodeURIComponent(username)}`);
}
