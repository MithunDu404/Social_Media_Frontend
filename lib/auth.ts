import api from "./api";
import { AuthResponse } from "@/types/auth";

export const loginUser = async (email: string, password: string) => {
  const res = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
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
