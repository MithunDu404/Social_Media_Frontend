"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/common/navbar";

// May be Need changes

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

  return(
    <>
      <Navbar/>
      {children}
    </>

  )
}
