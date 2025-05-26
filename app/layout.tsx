"use client";

import { SettingsProvider } from './contexts/settings-context';
import SettingsLoader from "./helpers/settings-helper/settings-helper";
import LoaderTheme from "./helpers/settings-helper/loaders/appearance/theme";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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

function ThemeReadyProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (theme && resolvedTheme) {
      document.documentElement.classList.add('theme-ready');
      setIsReady(true);
    }
  }, [theme, resolvedTheme]);

  return <div className={`prevent-foit ${isReady ? 'ready' : ''}`}>{children}</div>;
}

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
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system"
            enableSystem
            storageKey="settings"
          >
            <SettingsLoader />
            <LoaderTheme />
            <ThemeReadyProvider>
              <Toolbar />
              {children}
              <Toaster position="top-center" richColors />
            </ThemeReadyProvider>
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}