/**
 * Root Layout — `app/layout.tsx`  ·  DOCUMENTATION ONLY (no implementation yet)
 * See docs/FRONTEND_PLAN.md §1.3.
 *
 * Purpose: top-level App Router shell — `<html>`/`<body>`, fonts (Inter +
 * JetBrains Mono via next/font), global CSS, and global providers.
 * Responsibilities: mount design tokens; AuthProvider (session via httpOnly
 * cookie), ThemeProvider (light default), React Query, Toaster; default metadata.
 * Flow: RootLayout → route-group layouts ((marketing)/(auth)/(app)) → pages.
 * Dependencies: next/font, app/globals.css, context/* providers, @tanstack/react-query.
 * Related: app/globals.css, styles/theme.ts, app/page.tsx.
 * Security: only NEXT_PUBLIC_* in bundle; JWT in httpOnly cookie (never read by JS).
 * Performance: Server Component; fonts subset + display:swap; thin client providers.
 * A11y: lang="en"; AA contrast tokens; respect prefers-reduced-motion.
 * Error handling: pairs with app/error.tsx + not-found.tsx.
 * TODO: [ ] next/font  [ ] providers  [ ] base metadata + favicon  [ ] tokens
 */
export {};
