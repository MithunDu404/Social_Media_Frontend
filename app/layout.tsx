"use client"

import "./globals.css";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

// export const metadata = {
//   title: "Social Media App",
//   description: "Next.js Social Media App",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
