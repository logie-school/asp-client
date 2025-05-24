"use client";

import { SettingsProvider } from './contexts/settings-context';
import SettingsLoader from "./helpers/settings-helper/settings-helper";

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toolbar } from "@/components/toolbar";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { Settings } from "@/components/sections/settings/settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// // read theme from local storage
// const settings = typeof window !== "undefined" ? localStorage.getItem("settings") : null;
// const theme = settings ? JSON.parse(settings).appearance.theme : "system";


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
          <SettingsLoader />
          <ThemeProvider attribute="class" defaultTheme='dark'>
            <Toolbar />
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
