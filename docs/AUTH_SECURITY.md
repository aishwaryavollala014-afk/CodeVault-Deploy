# 🔐 CodeVault — Authentication & Authorization Security

> How CodeVault proves *who* a user is and enforces *what* they can do. Companion to [SECURITY_PLAN](SECURITY_PLAN.md) (§2–3), [BACKEND_PLAN](BACKEND_PLAN.md) (§5), and [GITHUB_SECURITY](GITHUB_SECURITY.md). Implemented in `web-backend/src/services/auth.service.ts`, `lib/jwt.ts`, `middlewares/auth.middleware.ts` and verified by `git-service`.

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

CodeVault is **GitHub-OAuth-first and passwordless**. This doc defines the OAuth flow, token lifecycle, session management, and the resource-ownership model that prevents one user accessing another's data — across **both** services using a shared JWT.

---

## 2. Architecture

```
Browser → GET /auth/github/start → 302 GitHub (state in Redis)
GitHub → GET /auth/github/callback?code&state → validate state → exchange code
       → upsert user → encrypt GitHub token → issue access JWT (cookie) + refresh (hashed in DB)
Browser → web-backend & git-service: send cookie/Bearer → both verify SAME JWT (shared JWT_SECRET)
```

- **Access token:** short-lived JWT (≈30 min) in `httpOnly Secure SameSite=Lax` cookie.
- **Refresh token:** opaque random, **SHA-256 hashed** in `auth_sessions`, rotated on use.
- **git-service trust boundary (S1):** verifies the *user's* JWT — never a static internal key in the browser.
- **Browser extension (`client=extension`):** the cross-browser extension signs in as the **same user** via a PKCE OAuth handoff and receives its **own** JWT access + rotating refresh (session tagged `client=extension` in `auth_sessions`). It is **not** the website cookie — extensions can't (and shouldn't) read the httpOnly cookie — so it is stored in `chrome.storage.local` and **independently revocable**. The same git-service S1 verify accepts it. See [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md) + [EXTENSION_PLAN.md](EXTENSION_PLAN.md) §3.

---

## 3. Best Practices

- OAuth Authorization Code + `state` (anti-CSRF), strict redirect-URI allowlist.
- **PKCE:** GitHub OAuth Apps don't support PKCE; `state` is the practical CSRF control. (GitHub *Apps* support PKCE — a future migration path.)
- Short access TTL + refresh rotation with **reuse detection** (replay → revoke the whole token family).
- Tokens in **httpOnly cookies**, never `localStorage`.
- **MFA delegated to GitHub** — don't reimplement.
- Ownership-based authorization derived from the JWT `sub` only.

---

## 4. Threats

OAuth CSRF / token interception · JWT forgery / `alg=none` · refresh-token theft & replay · session fixation · account-linking abuse · over-broad GitHub scope · broken access control (BOLA/IDOR) · credential stuffing (mitigated by passwordless).

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| OAuth CSRF | one-time `state` stored in Redis (TTL 10 min), single-use |
| JWT forgery | `jsonwebtoken.verify` with fixed `HS256` secret; reject wrong `type` |
| Refresh theft/replay | hashed storage + rotation + **family revocation** on reuse |
| Session fixation | new session id on every login/refresh |
| Over-broad scope | request least scopes (`read:user user:email repo`); per-repo where possible |
| BOLA/IDOR | `req.user.id` from JWT only; every query filters `userId` |
| Account lockout | throttle OAuth endpoints per IP + identity |

---

## 6. Implementation Guidelines

- `signAccessToken(user)` builds the frozen `JwtClaims` shape — shared with git-service.
- `requireAuth` reads cookie or Bearer, verifies, attaches `req.user`; `requireAdmin` for vertical checks.
- Logout revokes the refresh session and clears cookies.
- Account deletion → soft-delete user, **purge tokens**, revoke all sessions.

---

## 7. Folder Structure

```
web-backend/src/
├── services/auth.service.ts   # OAuth exchange, sessions, rotation, reuse detection
├── lib/jwt.ts                 # sign/verify access tokens
├── middlewares/auth.middleware.ts  # requireAuth / requireAdmin
└── validators/auth.validator.ts
git-service/src/middlewares/auth.middleware.ts  # verifies the SAME JWT (S1)
```

---

## 8. Recommended Libraries

`jsonwebtoken` (HS256), Node `crypto` (random + SHA-256 hashing), `ioredis` (state + Redis sessions), `cookie-parser`. Future: `@simplewebauthn/server` for passkeys.

---

## 9. Configuration Examples

```env
JWT_SECRET=<32+ byte random, SAME in both services>
JWT_ACCESS_TTL=1800        # 30 min
JWT_REFRESH_TTL=1209600    # 14 days
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/auth/github/callback
```

---

## 10. Production Considerations

- **Redis sessions** for refresh-token family tracking + "logout all devices".
- **Login history / device management:** persist `userAgent`/`ip` on `auth_sessions`; surface an "active sessions" UI with revoke.
- **CAPTCHA / account lockout** on abnormal OAuth volume.
- Rotate `JWT_SECRET` with a dual-key window; rotate GitHub client secret annually / on suspicion.

---

## 11. Future Improvements

- **Passkeys (WebAuthn)** as a second factor or alternative login.
- **Trusted devices** to reduce re-auth friction.
- Migrate GitHub OAuth App → **GitHub App** for PKCE + fine-grained, per-repo permissions.
- **RBAC** beyond `user`/`admin` if teams/orgs arrive.

---

## 12. Checklist

- [x] OAuth `state` single-use (Redis); redirect-URI allowlisted
- [x] Access JWT short-lived, httpOnly Secure SameSite cookie
- [x] Refresh hashed, rotated, reuse-detection revokes family
- [x] Both services verify the same JWT (no static key in browser)
- [x] `req.user.id` from token only; ownership filter everywhere
- [x] Logout revokes session; deletion purges tokens
- [x] GitHub scope minimized
- [x] Auth endpoints rate-limited
- [ ] Extension session (`client=extension`) issued via PKCE, stored in `chrome.storage.local`, independently revocable (Settings)

---

## 13. References

- [SECURITY_PLAN.md](SECURITY_PLAN.md) §2–3 · [GITHUB_SECURITY.md](GITHUB_SECURITY.md) · [REDIS_SECURITY.md](REDIS_SECURITY.md) · [ATTACK_PREVENTION.md](ATTACK_PREVENTION.md) · [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md)
- OWASP Authentication / Session Management Cheat Sheets · RFC 6749 (OAuth 2.0) · RFC 7636 (PKCE)


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [x] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [x] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
