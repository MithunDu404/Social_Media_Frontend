import { create } from "zustand";
import { User } from "@/types/auth";
import Cookies from "js-cookie";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  login: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasHydrated: false,

  login: (user, token) => {
    Cookies.set("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    Cookies.remove("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return {};
      const updated = { ...state.user, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return { user: updated };
    });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;

    const token = Cookies.get("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      set({
        token,
        user: JSON.parse(user),
        isAuthenticated: true,
        hasHydrated: true,
      });
    } else {
      // 🔑 hydration finished even without auth
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        hasHydrated: true,
      });
    }
  },
}));
