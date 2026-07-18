<div align="center">

# 📱 CodeVault — Mobile App (Expo Go)

### The web app's features on your phone — real analytics, sync, and messaging.

</div>

> Lives in [`mobile/`](../mobile). Owner: **Gaurav**. Built to mirror the web frontend against the
> same backends (`web-backend` + `git-service`), so the data is identical.

---

## What it is

A React Native app built with **Expo SDK 54** and **expo-router** (file-based routing). It runs on
a physical phone through the **Expo Go** app during development — nothing is containerized and no
native build step is required. It talks to the existing services over your LAN.

| Aspect | Choice |
|--------|--------|
| Framework | Expo SDK 54, React Native 0.81, React 19 |
| Routing | `expo-router` (root at `mobile/src/app`) |
| Server state | TanStack Query + `axios` (two base URLs: web-backend + git-service) |
| Auth token | `expo-secure-store` (Bearer), refresh via the native cookie jar |
| Charts | Hand-rolled with `react-native-svg` (Expo-Go-safe — no Skia/native deps) |
| Styling | `StyleSheet` + a shared theme (`src/lib/theme.ts`) mirroring the web palette |

## Feature parity with the web app

| Screen | Source of data |
|--------|----------------|
| Overview / Dashboard | `web-backend GET /api/stats` — totals, difficulty donut, per-platform bars, 12-month heatmap |
| Analytics | `GET /api/stats` — ratings, difficulty, topics, languages, activity |
| Repositories | `git-service GET /api/repos` + `/api/problems` |
| Sync | `git-service /api/sync`, `/sync/status`, `/sync/activity` (with "Sync now") |
| Recent submissions | `git-service GET /api/problems` (all platforms, tappable) |
| Inbox + Chat | `web-backend /api/messages*` — conversation list + real chat thread with send |
| Public profile | `GET /api/public/:handle` |
| Settings | `GET/PATCH /api/settings`, `/api/platforms` (connections), auto-sync toggle, sign out |
| Notifications | `GET /api/notifications`, `POST /api/notifications/read-all` |
| Connect a platform | `POST /api/platforms/connect` |

## Auth

**Email magic-link.** The user enters the email on their account and receives a short-lived token;
the app posts it to `POST /api/auth/email/verify`, which returns an `accessToken` in the body
(stored in secure storage). Email login resolves to the **same user** a GitHub login would (matched
by email), so the mobile app shows the user's real, GitHub-linked data.

> Without SMTP configured, the magic-link token is printed to the **web-backend console** (or read
> from the `verification_tokens` table). The verify screen accepts either the raw token or the full
> magic-link URL.

**Why not GitHub OAuth (yet):** GitHub OAuth Apps only allow http/https callback URLs, not a native
deep-link scheme, so mobile GitHub sign-in needs a backend token-handoff redirect (the same work as
the browser-extension auth handoff). Tracked, not yet built. See
[EXTENSION_PLAN.md](EXTENSION_PLAN.md) for the parallel handoff pattern.

## Project layout (`mobile/src`)

```
app/                       # expo-router routes
  (auth)/login, verify     # email magic-link
  (tabs)/                  # Overview, Analytics, Repos, Sync, Inbox, Settings
  chat/[handle]            # message thread
  u/[username]             # public profile
  problem/[platform]/[number]
  connect, notifications
api/       client.ts (axios + bearer + 401 refresh), endpoints.ts, token.ts
auth/      AuthContext.tsx (email login, profile hydration, persistence)
components/ ui.tsx (UI kit), charts.tsx (bars, donut, heatmap)
lib/       config.ts (API base URLs), theme.ts, storage.ts, stats.ts (stats → view-models)
```

## Run it

The phone can't reach the laptop's `localhost`, so point the app at the machine's **LAN IP** (same
Wi-Fi). Find it with `ipconfig getifaddr en0` (macOS).

```bash
cd mobile
npm install
cp .env.example .env          # set EXPO_PUBLIC_WEB_API / EXPO_PUBLIC_GIT_API to your LAN IP
npx expo start --lan          # scan the QR in Expo Go
```

- **CORS:** native requests aren't subject to browser CORS, so device testing needs no allowlist
  change. Only `npx expo start --web` (browser preview) would need the LAN origin added to
  web-backend's CORS allowlist.
- Requires **web-backend (:4000)** and **git-service (:5050)** running and reachable on the LAN.
- Your Expo Go app must match the SDK: this project targets **SDK 54**.

## Known gaps / next steps

- GitHub OAuth sign-in (needs the backend token-handoff above).
- `avatarUrl` isn't returned by `GET /api/settings`, so the avatar hydrates only after a fresh login
  (the login response carries it). One-line backend add would fix bootstrap hydration.
- Problem detail is a stub — full question/solution rendering from git-service is next-phase.
- Options like message-thread pagination and follow/unfollow toggles are minimal.
