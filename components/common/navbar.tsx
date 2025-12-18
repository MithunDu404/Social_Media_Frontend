"use client";
// Need Changes
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, MessageCircle, Home, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  // Hide navbar on auth pages
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return null;
  }

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const NavLinks = () => (
    <>
      <Link
        href="/feed"
        className={`flex items-center gap-2 text-sm font-medium ${
          pathname === "/feed" ? "text-black" : "text-muted-foreground"
        }`}
      >
        <Home size={18} />
        Feed
      </Link>

      <Link
        href="/messages"
        className={`flex items-center gap-2 text-sm font-medium ${
          pathname.startsWith("/messages")
            ? "text-black"
            : "text-muted-foreground"
        }`}
      >
        <MessageCircle size={18} />
        Messages
      </Link>
    </>
  );

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        
        {/* Left */}
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64">
              <SheetTitle className="sr-only">
                Navigation menu
              </SheetTitle>
              <div className="flex flex-col gap-6 pt-6 p-4">
                <Link href="/feed" className="text-lg font-bold">
                  SocialApp
                </Link>

                <div className="flex flex-col gap-4">
                  <NavLinks />
                </div>

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="mt-6"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/feed" className="text-lg font-bold">
            SocialApp
          </Link>
        </div>

        {/* Center (Desktop only) */}
        <div className="hidden items-center gap-8 md:flex">
          <NavLinks />
        </div>

        {/* Right */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex cursor-pointer items-center gap-2">
              {/* Username – desktop only */}
              <span className="hidden text-sm font-medium md:block">
                {user?.user_name}
              </span>

              {/* Avatar */}
              <Avatar>
                <AvatarFallback>
                  {user?.user_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/profile/${user?.id}`}
                className="flex items-center gap-2"
              >
                <User size={16} />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
