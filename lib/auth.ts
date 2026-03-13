import api from "./api";
import { AuthResponse, User } from "@/types/auth";

export const loginUser = async (email: string, password: string) => {
  const res = await api.post<AuthResponse>("/auth/login", { email, password });
  return res.data;
};

export const registerUser = async (
  user_name: string,
  email: string,
  password: string
) => {
  const res = await api.post<AuthResponse>("/auth/register", {
    user_name,
    email,
    password,
  });
  return res.data;
};

export const registerWithGoogle = async (credential: string) => {
  const res = await api.post<AuthResponse>("/auth/google", {
    credential,
  });
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get<User>("/auth/me");
  return res.data;
};
