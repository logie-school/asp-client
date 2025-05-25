"use client";

import { SettingsProvider } from './contexts/settings-context';
import SettingsLoader from "./helpers/settings-helper/settings-helper";
import LoaderTheme from "./helpers/settings-helper/loaders/appearance/theme";

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toolbar } from "@/components/toolbar";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Read theme from localStorage (SSR-safe default)
function getInitialTheme() {
  if (typeof window !== "undefined") {
    try {
      const settings = localStorage.getItem("settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed?.appearance?.theme || "system";
      }
    } catch {}
  }
  return "system";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [activeButton, setActiveButton] = useState<number | null>(0);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SettingsProvider>
          <ThemeProvider attribute="class" defaultTheme={getInitialTheme()} enableSystem>
            {/* LoaderTheme syncs context to next-themes */}
            <SettingsLoader />
            <LoaderTheme />
            <Toolbar />
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
