import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeVault — One dashboard for your competitive programming, synced to GitHub",
  description: "One dashboard for your competitive programming across LeetCode, Codeforces, CodeChef and HackerRank — with accepted solutions auto-synced to GitHub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`} style={{ backgroundColor: "var(--paper)" }}>
        {children}
      </body>
    </html>
  );
}
