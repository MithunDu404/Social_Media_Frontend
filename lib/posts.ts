import api from "./api";
import { Post } from "@/types/post";

// GET /posts/ — feed posts (from followed users)
export const fetchFeedPosts = async (page = 1, limit = 10): Promise<Post[]> => {
  const res = await api.get(`/posts?page=${page}&limit=${limit}`);
  return res.data;
};

// GET /posts/:postId
export const fetchPostById = async (postId: number): Promise<Post> => {
  const res = await api.get(`/posts/${postId}`);
  return res.data;
};

// GET /posts/user/:userId
export const fetchUserPosts = async (userId: number, page = 1, limit = 10): Promise<Post[]> => {
  const res = await api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
  return res.data;
};

// POST /likes/post/:postId
export const toggleLikePost = async (postId: number) => {
  const res = await api.post(`/likes/post/${postId}`);
  return res.data;
};

// POST /posts/
export const createPost = async (data: { title: string; blog: string }) => {
  const res = await api.post("/posts", data);
  return res.data;
};

// PUT /posts/:postId
export const updatePost = async (postId: number, data: { title?: string; blog?: string }) => {
  const res = await api.put(`/posts/${postId}`, data);
  return res.data;
};

// DELETE /posts/:postId
export const deletePost = async (postId: number) => {
  await api.delete(`/posts/${postId}`);
};

// POST /posts/:postId/media — attach uploaded media to a post
export const addMediaToPost = async (
  postId: number,
  media: { url: string; content_type: string; size: number },
) => {
  const res = await api.post(`/posts/${postId}/media`, media);
  return res.data;
};
