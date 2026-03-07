"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function ProfileRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      router.replace(`/profile/${user.id}`);
    } else {
      router.replace("/login");
    }
  }, [user, router]);

  return <p className="p-4">Redirecting...</p>;
}
