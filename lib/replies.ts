import api from "./api";
import { Reply } from "@/types/comment";

// GET /replies/:commentId
export const getReplies = async (commentId: number): Promise<Reply[]> => {
    const res = await api.get(`/replies/${commentId}`);
    return res.data;
};

// POST /replies/:commentId
export const createReply = async (commentId: number, reply: string): Promise<Reply> => {
    const res = await api.post(`/replies/${commentId}`, { reply });
    return res.data.reply;
};

// DELETE /replies/:replyId
export const deleteReply = async (replyId: number) => {
    await api.delete(`/replies/${replyId}`);
};

// POST /likes/reply/:replyId
export const toggleReplyLike = async (replyId: number) => {
    const res = await api.post(`/likes/reply/${replyId}`);
    return res.data;
};

// PATCH /replies/:replyId
export const updateReply = async (replyId: number, reply: string) => {
    const res = await api.patch(`/replies/${replyId}`, { reply });
    return res.data;
};
