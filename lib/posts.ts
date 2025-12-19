import api from "./api";
import { Post } from "@/types/post";

export const fetchPosts = async (): Promise<Post[]> => {
  const res = await api.get("/posts/user/1"); // For testing
  console.log(res);
  return res.data;
};

export const toggleLikePost = async (postId: number) => {
  console.log("api triggered")
  await api.post(`/likes/post/${postId}`);
};
