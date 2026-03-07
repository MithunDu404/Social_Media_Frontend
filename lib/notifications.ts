import api from "./api";
import { User } from "@/types/auth";

export type NotificationReason =
    | "FOLLOW"
    | "POST_LIKE"
    | "COMMENT_LIKE"
    | "REPLY_LIKE"
    | "COMMENT"
    | "REPLY"
    | "MESSAGE";

export interface Notification {
    id: number;
    receiver_id: number;
    creator_id: number;
    reason: NotificationReason;
    is_read: boolean;
    createdAt: string;
    creator?: Pick<User, "id" | "user_name" | "picture_url">;
}

export const getNotifications = async (page = 1): Promise<Notification[]> => {
    const res = await api.get(`/notifications?page=${page}&limit=20`);
    return res.data;
};

export const markNotificationAsRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async () => {
    await api.patch("/notifications/read-all");
};

export const deleteReadNotifications = async () => {
    await api.delete("/notifications");
};
