# 🧩 CodeVault — Browser Extension Security

> Security model for the cross-browser **WebExtension** that captures the user's own accepted solutions (**Path B v2**). Companion to [EXTENSION_PLAN](EXTENSION_PLAN.md), [AUTH_SECURITY](AUTH_SECURITY.md), [SECURITY_PLAN](SECURITY_PLAN.md), and [API_SECURITY](API_SECURITY.md). Target folder: `browser-extension/` (planning skeleton — no code yet).

---

## 1. Purpose

The extension runs **untrusted client code in the user's browser** and feeds captured submissions to git-service. This doc defines how it signs in as the **same CodeVault user**, how its token is scoped and revoked, how captured data is validated server-side, and how a compromised extension is contained.

---

## 2. Architecture

```
content script (platform page) → background SW → web-backend (auth) + git-service (ingest)
  capture own accepted code        holds JWT        issues/rotates token   verifies SAME JWT (S1)
```

- **Auth:** GitHub OAuth handoff (PKCE-style) → JWT access + rotating refresh, `client = extension`.
- **Token store:** `chrome.storage.local` (not `localStorage`/`window`); never the website's httpOnly cookie.
- **Trust boundary:** git-service `POST /api/ingest` treats the payload as **untrusted input** even though the JWT is valid.

---

## 3. Best Practices

- **Least-privilege manifest:** `host_permissions` scoped to the four platform domains + the CodeVault API domain; never `<all_urls>`.
- **No remote code:** strict MV3 `content_security_policy`; all logic bundled, no `eval`, no CDN scripts.
- **Dedicated, revocable token:** extension session is independent of the website cookie and can be killed without logging out the web app.
- **Own-data-only capture:** read only the signed-in user's **own accepted** submissions.
- **Validated message passing:** every content-script ↔ background message is origin-checked and schema-checked.

---

## 4. Threats

Malicious/compromised extension exfiltrating the JWT · token theft from extension storage · a hostile page spoofing capture messages to the background worker · forged/oversized ingest payloads · capturing data that is not the user's own · supply-chain compromise of a build dependency · over-broad host permissions · CSRF on the OAuth handoff · replay of captured submissions (double-push).

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| JWT exfiltration | short access TTL + rotating refresh + reuse-detection (family revoke); per-session revoke from Settings |
| Storage theft | `chrome.storage.local`, no token in DOM/`window`; optional session-only mode |
| Spoofed capture messages | validate `sender.origin`/`sender.id` + Zod-shape every runtime message |
| Forged/oversized ingest | server-side Zod validation, ownership check, **code size cap**, per-user rate-limit |
| Not-own data | capture only from the user's authenticated session; server cross-checks the connection owner |
| Replay / double-push | idempotency key (`ingest_log`) + dedupe vs `problems` table |
| OAuth handoff CSRF | one-time `state` + PKCE challenge in `launchWebAuthFlow` |
| Over-broad permissions | minimal `host_permissions`; request `scripting` only where needed |
| Supply chain | pinned deps + lockfile, `npm audit`/gitleaks in CI, reviewed build framework |

---

## 6. Implementation Guidelines

- Background service worker is the **only** holder of the token; content scripts request actions via validated messages, never receive the raw token.
- `POST /api/ingest` reuses git-service's existing JWT verify (S1) + repo-ownership check before any push.
- Normalize captures to the existing `SolutionToSync` shape; reject unknown platforms/languages.
- Tokens rotate on refresh; logout and "revoke this extension" purge the `client=extension` session.
- Surface every extension session in Settings → **active sessions** (userAgent/ip/last-seen) with revoke.

---

## 7. Folder Structure

```
browser-extension/src/
├── background/index.ts     # sole token holder; ingest dispatch
├── content/<platform>.ts   # capture only own accepted submissions
├── lib/auth.ts             # PKCE flow, token storage + rotation
├── lib/api-client.ts       # web-backend + git-service base URLs
└── lib/storage.ts          # chrome.storage.local wrappers
web-backend/src/services/auth.service.ts   # issues client=extension session
git-service/src/middlewares/auth.middleware.ts  # verifies SAME JWT (S1)
git-service/src/routes/ingest.routes.ts    # POST /api/ingest (validated)
```

---

## 8. Recommended Libraries

`webextension-polyfill` (cross-browser `browser.*`), **WXT** or **CRXJS + Vite** (build), `zod` (message + ingest validation), browser `chrome.identity` / `launchWebAuthFlow` (OAuth handoff). Reuse web-backend `jsonwebtoken` + `ioredis` for token issuance — no new auth stack.

---

## 9. Configuration Examples

```env
# browser-extension/.env.example — PUBLIC values only, no secrets
VITE_API_URL=https://api.codevault.app          # web-backend
VITE_GIT_SERVICE_URL=https://sync.codevault.app # git-service
VITE_OAUTH_REDIRECT=https://api.codevault.app/api/v1/auth/extension/callback
```

```jsonc
// manifest (MV3) — least-privilege
{
  "manifest_version": 3,
  "host_permissions": [
    "https://leetcode.com/*", "https://codeforces.com/*",
    "https://www.codechef.com/*", "https://www.hackerrank.com/*",
    "https://api.codevault.app/*", "https://sync.codevault.app/*"
  ],
  "permissions": ["storage", "scripting", "identity"],
  "content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }
}
```

---

## 10. Production Considerations

- **Per-session revocation UI** (Settings) and "revoke all extensions" on suspicion.
- **Store-review hardening:** minimal permissions, clear privacy disclosure, no obfuscated code (required by Chrome Web Store / AMO / App Store).
- **Token rotation** + dual-key `JWT_SECRET` window shared with the services.
- **Telemetry:** alert on ingest spikes, ownership-check failures, and JWT reuse events.

---

## 11. Future Improvements

- Migrate GitHub OAuth App → **GitHub App** for PKCE-native + fine-grained per-repo permissions.
- **Signed captures:** background worker signs payloads so git-service can attest origin.
- Optional **end-to-end** path where the extension commits via the user's own GitHub token (no code transits the server).
- Passkey-bound extension sessions once WebAuthn lands (see [AUTH_SECURITY](AUTH_SECURITY.md) §11).

---

## 12. Checklist

- [ ] Manifest least-privilege (4 platforms + API domain only; no `<all_urls>`)
- [ ] MV3 CSP: `script-src 'self'`, no remote code
- [ ] Token in `chrome.storage.local`, never DOM/`localStorage`
- [ ] Background worker is the sole token holder; content scripts never see it
- [ ] OAuth handoff uses one-time `state` + PKCE
- [ ] `client=extension` session is independently revocable from Settings
- [ ] `POST /api/ingest` Zod-validated, ownership-checked, size-capped, rate-limited
- [ ] Idempotency key prevents double-push
- [ ] Runtime messages origin- and schema-validated
- [ ] Pinned deps + lockfile + audit/gitleaks in CI

---

## 13. References

- [EXTENSION_PLAN.md](EXTENSION_PLAN.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md) · [API_SECURITY.md](API_SECURITY.md) · [SECURITY_PLAN.md](SECURITY_PLAN.md) · [ATTACK_PREVENTION.md](ATTACK_PREVENTION.md)
- Chrome Web Store program policies · Firefox Add-on policies · Apple App Store Review Guidelines · OWASP Browser Extension security guidance · RFC 7636 (PKCE)
