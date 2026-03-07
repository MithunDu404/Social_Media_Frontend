import api from "./api";
import { Comment } from "@/types/comment";

// GET /comments/:postId
export const getComments = async (postId: number): Promise<Comment[]> => {
    const res = await api.get(`/comments/${postId}`);
    return res.data;
};

// POST /comments/:postId
export const createComment = async (postId: number, comment: string): Promise<Comment> => {
    const res = await api.post(`/comments/${postId}`, { comment });
    return res.data.comment;
};

// PATCH /comments/:commentId
export const updateComment = async (commentId: number, comment: string) => {
    const res = await api.patch(`/comments/${commentId}`, { comment });
    return res.data;
};

// DELETE /comments/:commentId
export const deleteComment = async (commentId: number) => {
    await api.delete(`/comments/${commentId}`);
};

// POST /likes/comment/:commentId
export const toggleCommentLike = async (commentId: number) => {
    const res = await api.post(`/likes/comment/${commentId}`);
    return res.data;
};
