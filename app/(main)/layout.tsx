"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const {hasHydrated} = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if(!hasHydrated) return;
    if (!isAuth) router.push("/login");
  }, [hasHydrated,isAuth]);

  if(!hasHydrated) return null;

  return <>{children}</>;
}
