import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the built-in Next.js dev badge (the black circle/triangle in the corner) so it
  // doesn't get mistaken for CodeVault branding. Only affects `npm run dev`.
  devIndicators: false,
};

export default nextConfig;
