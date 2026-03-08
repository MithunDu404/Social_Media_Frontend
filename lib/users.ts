import api from "./api";
import { User } from "@/types/auth";
import { Post } from "@/types/post";

export interface UserProfile extends User {
    location?: string;
    dob?: string;
    about?: string;
    phone?: string;
}

export interface FollowData {
    count: number;
    users: Pick<User, "id" | "user_name" | "picture_url">[];
}

export const getUserProfile = async (userId: number): Promise<UserProfile> => {
    const res = await api.get(`/users/${userId}`);
    return res.data;
};

export const getUserPosts = async (userId: number, page = 1): Promise<Post[]> => {
    const res = await api.get(`/posts/user/${userId}?page=${page}&limit=10`);
    return res.data;
};

export const toggleFollow = async (userId: number): Promise<{ following: boolean }> => {
    const res = await api.post(`/follow/${userId}`);
    return res.data;
};

export const getFollowers = async (userId: number): Promise<FollowData> => {
    const res = await api.get(`/follow/${userId}/followers`);
    return res.data;
};

export const getFollowings = async (userId: number): Promise<FollowData> => {
    const res = await api.get(`/follow/${userId}/followings`);
    return res.data;
};

export const searchUsers = async (search?: string): Promise<User[]> => {
    const res = await api.get(`/users${search ? `?search=${search}` : ""}`);
    return res.data;
};

export const updateProfile = async (
    userId: number,
    data: {
        user_name?: string;
        about?: string;
        location?: string;
        phone?: string;
    }
): Promise<UserProfile> => {
    const res = await api.put(`/users/${userId}`, data);
    // Backend returns { message, user } — extract the user object
    return res.data.user ?? res.data;
};
