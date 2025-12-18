import api from "./api";
import { Post } from "@/types/post";

export const fetchPosts = async (): Promise<Post[]> => {
  const res = await api.get("/posts/user/1"); // For testing
  console.log(res);
  return res.data;
};

export const likePost = async (postId: number) => {
  await api.post(`/posts/${postId}/like`);
};

export const unlikePost = async (postId: number) => {
  await api.delete(`/posts/${postId}/like`);
};
