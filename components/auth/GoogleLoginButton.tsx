"use client";

import { GoogleLogin } from "@react-oauth/google";
import { registerWithGoogle } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function GoogleLoginButton() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          if (!credentialResponse.credential) return;
          const data = await registerWithGoogle(credentialResponse.credential);
          login(data.user, data.token);
          router.push("/feed");
        } catch {
          alert("Google sign-in failed. Please try again.");
        }
      }}
      onError={() => {
        alert("Google Login Failed");
      }}
    />
  );
}
