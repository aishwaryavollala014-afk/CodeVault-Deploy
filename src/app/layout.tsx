import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeVault",
  description:
    "Unified competitive-programming dashboard that auto-syncs your solutions to GitHub.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
