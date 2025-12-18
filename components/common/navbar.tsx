"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { user, logout, isAuthenticated } = useAuthStore();

  // ❌ Do not show navbar on auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        
        {/* Left: Logo */}
        <Link href="/feed" className="text-lg font-bold">
          SocialApp
        </Link>

        {/* Center: Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/feed" className="hover:underline">
            Feed
          </Link>
          <Link href="/messages" className="hover:underline">
            Messages
          </Link>
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-4">
          <Link href={`/profile/${user?.id}`} className="text-sm font-medium">
            {user?.user_name}
          </Link>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>

      </div>
    </nav>
  );
}
