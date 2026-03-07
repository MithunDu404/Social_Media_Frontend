import api from "./api";
import { User } from "@/types/auth";

export interface Message {
    id: number;
    message: string;
    sender_id: number;
    receiver_id: number;
    is_read: boolean;
    createdAt: string;
    updatedAt: string;
    sender?: Pick<User, "id" | "user_name" | "picture_url">;
    receiver?: Pick<User, "id" | "user_name" | "picture_url">;
}

export interface Conversation {
    user: Pick<User, "id" | "user_name" | "picture_url">;
    lastMessage: Message;
}

// GET /messages/ — list all conversations
export const getConversations = async (): Promise<Conversation[]> => {
    const res = await api.get("/messages");
    return res.data;
};

// GET /messages/with/:userId — get conversation with a specific user
export const getConversationWithUser = async (userId: number): Promise<Message[]> => {
    const res = await api.get(`/messages/with/${userId}`);
    return res.data;
};

// POST /messages/:receiverId — send a message
export const sendMessage = async (receiverId: number, message: string): Promise<Message> => {
    const res = await api.post(`/messages/${receiverId}`, { message });
    return res.data.data;
};

// PATCH /messages/:messageId/read
export const markMessageAsRead = async (messageId: number) => {
    await api.patch(`/messages/${messageId}/read`);
};
