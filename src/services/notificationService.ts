import { apiClient } from "./apiClient";

export interface AppNotification {
  id: string;
  topic: string;
  message: string;
  link?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string; email: string };
  isRead: boolean;
}

class NotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    return apiClient.get<AppNotification[]>("/notifications");
  }

  async getUnreadCount(): Promise<number> {
    const result = await apiClient.get<{ count: number }>(
      "/notifications/unread-count",
    );
    return result.count;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.post(`/notifications/${notificationId}/read`, {});
  }

  // Always bulk server-side (even for one id) — a per-user hide, not a real
  // delete, so other users still see the same notification.
  async deleteMine(notificationIds: string[]): Promise<void> {
    await apiClient.delete("/notifications/mine", { data: { notificationIds } });
  }
}

export const notificationService = new NotificationService();
