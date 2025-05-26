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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SettingsProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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