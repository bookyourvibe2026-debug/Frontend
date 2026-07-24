import { apiRequest, type Paginated } from "./client";
import type { CustomerNotification } from "./types";

export function getNotifications(params: { page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<CustomerNotification>>("/notifications", {
    query: params,
    audience: "customer",
  });
}

export function getUnreadCount() {
  return apiRequest<{ count: number }>("/notifications/unread-count", {
    audience: "customer",
  });
}

export function markNotificationRead(id: string) {
  return apiRequest<CustomerNotification>(`/notifications/${id}/read`, {
    method: "PATCH",
    audience: "customer",
  });
}

export function markAllNotificationsRead() {
  return apiRequest<null>("/notifications/mark-all-read", {
    method: "POST",
    audience: "customer",
  });
}
