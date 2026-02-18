import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { getThemeSettings } from "@/lib/queries/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stella Coin",
  description: "フィットネスジム向けコイン管理システム",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeSettings = await getThemeSettings();

  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          initialTheme={themeSettings.theme_mode}
          initialAccentColor={themeSettings.accent_color}
          initialFontSize={themeSettings.font_size}
        >
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
