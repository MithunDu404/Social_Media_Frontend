"use client";

import { GoogleLogin } from "@react-oauth/google";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function GoogleLoginButton() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        const res = await api.post("/auth/google", {
          credential: credentialResponse.credential,
        });

        login(res.data.user, res.data.token);
        router.push("/feed");
      }}
      onError={() => {
        alert("Google Login Failed");
      }}
    />
  );
}
