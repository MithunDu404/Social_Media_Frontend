import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Providers } from "./providers";
import { AuthHydrator } from "@/components/auth/AuthHydrator";
import { ThemeProvider } from "@/components/common/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SocialApp",
  description: "A modern social media platform",
  icons: {
    icon: "/social_favicon_1773596725126.png",
    apple: "/social_favicon_1773596725126.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
            <Providers>
              <AuthHydrator />
              {children}
            </Providers>
          </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
