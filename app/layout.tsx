import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Providers } from "./providers";
import { AuthHydrator } from "@/components/auth/AuthHydrator";

export const metadata: Metadata = {
  title: "SocialApp",
  description: "A modern social media platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <Providers>
            <AuthHydrator />
            {children}
          </Providers>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
