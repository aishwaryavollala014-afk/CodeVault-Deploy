import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone admin console. Runs on its own port (3100); reads the shared cv_access cookie
  // (cookies are host-scoped, so a session on localhost:3000 is visible here on localhost).
};

export default nextConfig;
