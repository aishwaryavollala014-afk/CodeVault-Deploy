import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the built-in Next.js dev badge (the black circle/triangle in the corner) so it
  // doesn't get mistaken for CodeVault branding. Only affects `npm run dev`.
  devIndicators: false,

  // Lean production image for Docker/Fly (bundles a minimal Node server).

  // Same-origin proxy for deployment: the browser only ever talks to this frontend's origin,
  // so the session cookie + CSRF work with no cross-domain headaches. In production set the
  // BACKEND_URL / GIT_URL env vars to the (private) service URLs; locally these are unset so
  // the app calls the services directly. See docs/DEPLOY.md.
  async rewrites() {
    const backend = process.env.BACKEND_URL;
    const git = process.env.GIT_URL;
    const rules = [];
    if (backend) rules.push({ source: "/api/:path*", destination: `${backend}/api/:path*` });
    if (git) rules.push({ source: "/gitapi/:path*", destination: `${git}/api/:path*` });
    return rules;
  },
};

export default nextConfig;
