# 🛡️ CodeVault — Security Architecture Blueprint

> Application Security Architect / DevSecOps / Pentester review. **Planning only — no code/config.** Frameworks: **OWASP Top 10 (2021), OWASP API Security Top 10 (2023), Zero Trust, Defense in Depth, Least Privilege.** Assume nothing is secure until proven.

---

## 0. Crown jewels (why this app is high-risk)

CodeVault is not a normal CRUD app. It stores **bearer credentials to third-party systems**:

| Asset | What it grants an attacker | Blast radius |
|------|----------------------------|--------------|
| 🔴 **Platform session tokens** (LeetCode etc., Path B) | Impersonate the user on that platform | External account takeover, per user |
| 🔴 **GitHub OAuth/PAT (repo write)** | Push to / read the user's repos | Supply-chain risk on the user's own projects |
| 🟠 **App JWT / refresh tokens** | Act as the user in CodeVault | Account takeover (in-app) |
| 🟠 **User PII** (email from GitHub) | Phishing, enumeration | Privacy harm |
| 🟡 User's solution code | Already destined for (often public) GitHub | Low if repo public; higher if private |

> **Design consequence:** a single database read or a single leaked log line can be catastrophic. **Encryption-at-rest of tokens, strict secret hygiene, and least-privilege scoping are MANDATORY, not optional.**

---

## 1. Security Audit — risks, attack surfaces, severity

### 1.1 Attack surface map
```
[Anon Internet] → Landing/Legal (static)                         (low)
[Anon] → web-backend: OAuth start/callback, GET /public/:username  (med — enum/SSRF/CSRF)
[User] → web-backend: auth, user, connections, stats, notifications (high — IDOR, tokens)
[User] → git-service: sync trigger/status                          (high — authZ, key exposure)
services → PostgreSQL / Redis                                      (critical — token store)
git-service → platform APIs (authed) + GitHub API (write)          (critical — SSRF, secrets)
web-backend → platform public APIs (by username)                  (med — SSRF/scrape-amplify)
cron workers (git-service)                                        (high — decrypted tokens in memory)
CI/CD, dependencies, secrets                                      (high — supply chain)
```

### 1.2 Component risk ranking

| Component | Risk | Why |
|-----------|------|-----|
| Token store (DB) + crypto | 🔴 Critical | Holds external credentials; breach = mass takeover |
| git-service auth boundary (browser→service) | 🔴 Critical | Naive "internal API key in browser" = total bypass |
| Cron/worker token handling | 🔴 High | Decrypts tokens; any log/leak exposes them |
| OAuth flow (state/redirect/scope) | 🔴 High | Token theft, account linking abuse, over-broad GitHub scope |
| Connections + sync APIs (BOLA/IDOR) | 🔴 High | Cross-user access if ownership not enforced both sides |
| Public profile endpoint | 🟠 Medium | Enumeration, scraping, excessive data exposure |
| Platform fetch by username (SSRF) | 🟠 Medium | Unvalidated username → SSRF/path abuse |
| Problem detail / README render (XSS/markdown-injection) | 🟠 Medium | Platform-sourced HTML/titles are untrusted |
| Dependencies / CI/CD | 🟠 High | Supply-chain compromise → secrets |
| Settings (mass assignment, deletion) | 🟠 Medium | Privilege/field tampering; incomplete purge |
| Avatar upload (if built) | 🟡 Low–Med | New file-upload attack class (recommend: don't build it) |
| Landing/legal | 🟢 Low | Static |

### 1.3 Top issues (severity · impact)

| # | Issue | Sev | Impact |
|---|-------|-----|--------|
| S1 | Static internal key shipped to browser for git-service | **Critical** | Anyone can call sync for any user / forge requests |
| S2 | Platform/GitHub tokens not envelope-encrypted at rest | **Critical** | DB read → external account takeover at scale |
| S3 | Over-broad GitHub scope (full repo write to all repos) | **Critical** | One token = write to *all* the user's repos |
| S4 | Missing per-request resource-ownership checks (BOLA/IDOR) | **High** | User A reads/triggers User B's data |
| S5 | Secrets/tokens in logs | **High** | Log access = credential theft |
| S6 | OAuth without state+PKCE+redirect allowlist | **High** | CSRF login, token interception |
| S7 | No CSRF protection on cookie-auth mutations | **High** | Forged state-changing requests |
| S8 | SSRF via unvalidated username in platform fetch | **High** | Internal network access / pivot |
| S9 | Public profile enumeration + scraping + PII leak | **Medium** | Mass data harvest, privacy |
| S10 | Stored XSS from platform-sourced content | **Medium** | Session/UI compromise |
| S11 | Sync trigger abuse → resource exhaustion/DoS | **Medium** | Cost + upstream bans |
| S12 | Incomplete deletion (orphan tokens) | **Medium** | Lingering credentials, GDPR breach |

---

## 2. Authentication Security

> CodeVault is **GitHub-OAuth-first, passwordless**. That removes a whole password-attack class — keep it that way.

| Area | Recommendation (Mandatory ★ / Optional ◇) |
|------|-------------------------------------------|
| Registration | ★ Implicit via GitHub OAuth (first login = account). No self-service password signup. |
| Login | ★ OAuth Authorization Code + **PKCE**, `state` (anti-CSRF), strict redirect-URI allowlist. |
| Logout | ★ Revoke refresh token (server-side), clear httpOnly cookies, optional GitHub token revoke. |
| Password policy/hashing | ★ N/A (no passwords). If a fallback ever added: Argon2id, breach-check. |
| Email verification | ◇ Use GitHub-verified email; if magic-link used, sign + single-use + expire. |
| **MFA** | ◇ Delegated to GitHub (their MFA). Don't reimplement. Optionally require GitHub 2FA org policy. |
| Magic-link (if kept) | ★ One-time, signed (HMAC), short TTL, single-use, bound to email, rate-limited. |
| **Session mgmt** | ★ Short-lived access JWT (15–30 min) in **httpOnly + Secure + SameSite=Lax** cookie. |
| **Token lifecycle** | ★ Access (mins) + refresh (days) in DB; verify signature + exp + audience on every call. |
| **Refresh strategy** | ★ Rotate on every use; **reuse detection → revoke token family**; store hashed. |
| Account lockout | ★ Throttle OAuth/magic-link attempts; backoff per IP + identity. |
| Login throttling | ★ Rate-limit auth endpoints (per IP + per account). |
| Device/session mgmt | ◇ "Active sessions" list + revoke; show device/IP/last-seen. |
| Remember Me | ◇ = longer refresh TTL on explicit opt-in; never extend access token. |
| Trusted devices | ◇ Optional device fingerprint to reduce re-auth friction (don't weaken security). |
| Account recovery | ★ Via GitHub (re-OAuth). No separate recovery secret to steal. |

---

## 3. Authorization Security

- ★ **Resource ownership is the primary control.** Every protected request derives `userId` **from the verified JWT**, never from the request body/query. All DB reads/writes filter by `userId`.
- ★ **git-service enforces the same ownership** — it must re-check the caller owns the `connectionId` it's syncing (don't trust client-supplied IDs → prevents BOLA).
- ★ **RBAC (lightweight):** `user` (default), `admin` (internal). Admin is read-only on user data by default; sensitive admin actions audited.
- ◇ **ABAC** not needed yet (no teams/orgs). Keep a `role` field for future.
- ★ **Route protection:** middleware on all `(app)`/sync routes; default-deny.
- ★ **Privilege escalation prevention:** `role`, `plan`, `tokenStatus`, `userId` are server-controlled — never settable via API (see Mass Assignment §4).
- ★ **Horizontal access (BOLA):** ownership filter on every object. **Vertical access (BFLA):** function-level checks (a `user` can't hit admin functions).

---

## 4. API Security (OWASP API Top 10 mapped)

| API risk | CodeVault exposure | Control (★ mandatory) |
|----------|--------------------|-----------------------|
| API1 Broken Object-Level AuthZ (BOLA) | connections, problems, sync by id | ★ Ownership filter from JWT on every object |
| API2 Broken Authentication | OAuth, JWT, sync caller | ★ PKCE+state; verify JWT everywhere incl. git-service |
| API3 Broken Object Property-Level AuthZ | update user/connection/settings | ★ **Field allowlist**; reject `role/plan/tokenStatus/userId` |
| API4 Unrestricted Resource Consumption | sync trigger, public profile, stats | ★ Rate-limit + queue caps + concurrency limits + timeouts |
| API5 Broken Function-Level AuthZ (BFLA) | admin vs user | ★ Role checks per function; default-deny |
| API6 Sensitive Business Flow abuse | mass connect/sync, scraping public | ★ Throttle + bot defense + per-user quotas |
| API7 **SSRF** | platform fetch by username; GitHub URLs | ★ Strict username validation; **allowlist outbound hosts**; no user-controlled full URLs; block internal IP ranges |
| API8 Security Misconfiguration | headers, CORS, errors | ★ Strict CORS allowlist, security headers, safe errors |
| API9 Improper Inventory | two services, versions | ★ Inventory endpoints; version APIs; retire old |
| API10 Unsafe consumption of 3rd-party | platform/GitHub responses | ★ Treat all upstream data as untrusted; validate/sanitize |

**Also:** ★ no mass assignment (allowlist DTOs) · ★ no excessive data exposure (public profile returns *only* public fields, never email/tokens) · ★ consistent generic error responses (no stack traces, no "user exists" oracles) · ★ replay protection (short token TTL, `state`/nonce on OAuth) · ★ enumeration defense (uniform 404 on `/u/:username`, rate-limit).

---

## 5. Database Security

- ★ **Injection:** Prisma parameterizes by default — **forbid raw string-interpolated queries**; if `queryRaw` used, parameterize. (No NoSQL here; same rule for Redis keys.)
- ★ **Encryption at rest:** full-disk/managed-DB encryption **plus** application-layer **envelope encryption** for token columns (`sessionToken`, GitHub token) with keys in **KMS/secrets manager**, not in `.env`.
- ★ **Sensitive-field encryption:** tokens encrypted; store only a key reference + ciphertext; never index plaintext secrets.
- ★ **Least-privilege DB accounts:** per-service DB users; **git-service may only write `problems`/`sync_runs`** and read others (matches data-ownership rules). No superuser in app.
- ★ **Backups:** encrypted, access-controlled, **restore-tested**; backups also contain ciphertext only (keys separate).
- ★ **Secret management:** DB creds + master keys in a secrets manager; rotation policy.
- ★ **Audit logging:** append-only `audit_logs` for connect/disconnect/token-refresh/delete/admin.
- ★ **Data retention:** purge tokens on disconnect/delete; TTL on logs; minimize stored PII.

---

## 6. Frontend Security (Next.js)

- ★ **XSS / DOM-XSS:** rely on React escaping; **never** `dangerouslySetInnerHTML` on platform-sourced content (problem `question.md`, titles). If rendering markdown, sanitize (allowlist) server-side; `CodeBlock` renders as text, never executes.
- ★ **Token storage:** JWT/refresh in **httpOnly Secure cookies**, **never localStorage** (prototype's note about localStorage must not ship).
- ★ **CSRF:** SameSite=Lax cookies + **anti-CSRF token** (double-submit or origin check) on all state-changing requests; OAuth `state` covers the callback.
- ★ **CSP:** strict Content-Security-Policy (script-src 'self' + nonces; no inline-eval; restrict connect-src to the two API origins + GitHub/fonts).
- ★ **Clickjacking:** `frame-ancestors 'none'` (CSP) + `X-Frame-Options: DENY`.
- ★ **Secure cookies:** Secure, httpOnly, SameSite; scoped path/domain.
- ★ **Input validation/output encoding:** validate forms (Zod) client+server; encode all dynamic output.
- ★ **No secrets in client bundle:** only `NEXT_PUBLIC_*` non-secret config; **the git-service key must never reach the browser** (see §1 S1).
- ◇ **SRI** for any third-party scripts (prefer self-hosting fonts to drop external origins).

---

## 7. Backend Security

- ★ **Input validation:** schema-validate every request at the edge; reject unknown fields; size limits.
- ★ **Output sanitization:** sanitize/encode any upstream data before storing in GitHub markdown or returning to clients.
- ★ **Secure error handling:** typed errors → safe JSON envelope; **no stack traces / SQL / token fragments** to clients; log details server-side only.
- ★ **Secure logging:** structured logs with **redaction** of tokens/cookies/auth headers/PII; never log decrypted secrets or code bodies.
- ★ **Secret management:** all secrets from a manager; `.env` only for local dev; fail-fast on missing config.
- ★ **Env protection:** no secrets in repo/CI logs; `.gitignore` enforced; secret scanning in CI.
- ★ **Dependency security:** lockfiles, `npm audit`/SCA, pinned versions, Dependabot.
- ★ **Background job security:** workers handle decrypted tokens in memory only, zeroize ASAP, never log; **Redis with auth + private network**, not internet-exposed; job payloads carry IDs, **not secrets**.
- ★ **Queue security:** authenticated Redis, TLS in prod, ACLs; idempotency to prevent replay-amplification.
- ★ **File handling/temp cleanup:** avoid temp files; if any, randomized names, restricted perms, cleanup on finally.
- ★ **SSRF egress control:** outbound allowlist (platform + GitHub hosts only); deny RFC1918/link-local/metadata IPs.

---

## 8. Infrastructure Security

| Layer | Control |
|------|---------|
| Server hardening | Minimal base images, no root, drop capabilities, patched OS |
| Reverse proxy | TLS termination, request size/time limits, header normalization |
| Firewall / network seg | Only LB ports public; DB/Redis/git-service **private subnets**; default-deny egress + allowlist |
| HTTPS/TLS | TLS 1.2+; strong ciphers; auto-renew certs |
| HSTS | `max-age` long + includeSubDomains + preload |
| DNS security | Registrar lock, DNSSEC, CAA records |
| DDoS / WAF | CDN/WAF in front (rate-limit, bot rules, geo if needed) |
| CDN | Cache static; signed URLs if private assets |
| Load balancer | Health checks, TLS, sticky-less (stateless services) |
| Containers (if Docker) | Non-root, read-only FS, no secrets in image, scanned images, minimal layers |
| Cloud | IAM least privilege, KMS for keys, private networking, security groups |
| Secrets | Managed secret store + rotation; no plaintext in env/CI |

> **Zero Trust:** git-service is **not** trusted just because it's "internal" — it still authenticates every caller (user JWT) and authorizes ownership.

---

## 9. File Upload Security

**Recommendation (★): do NOT build avatar upload.** Use the GitHub avatar URL — this eliminates an entire attack class (malware, SVG-XSS, decompression bombs, path traversal, storage abuse). The prototype's "Change avatar" should map to "use GitHub avatar".

*If uploads are ever required:*
- ★ Allowlist types (png/jpg/webp only) by **content sniffing**, not extension/Content-Type.
- ★ Strict size limits; reject SVG (or sanitize); re-encode images to strip metadata/exploits.
- ★ Randomized filenames; never use user-supplied paths (anti traversal).
- ★ Store in object storage off the app host; private ACLs; serve via signed URLs.
- ◇ Malware scanning; temp upload TTL + cleanup; download Content-Disposition + no inline HTML.

---

## 10. User Data Protection (encryption in transit & at rest)

| Data | In transit | At rest | Notes |
|------|-----------|---------|-------|
| Platform session tokens | TLS | ★ Envelope-encrypted (KMS) | Never logged/returned; purge on disconnect/delete |
| GitHub token | TLS | ★ Encrypted | Least scope; revoke on logout/delete |
| App JWT/refresh | TLS, httpOnly cookie | refresh hashed in DB | Rotate; reuse detection |
| Email (PII) | TLS | DB (managed encryption) | Minimize; never in public profile/logs |
| Payment info | — | — | **None today** (pricing deferred); if added → use PCI-compliant processor (Stripe), never store card data |
| API keys (GitHub/3rd-party) | TLS | secrets manager | Rotate; per-env |
| Uploaded files | — | — | None (recommended) |
| Logs with user info | TLS to log sink | encrypted sink | Redact PII/tokens; retention TTL |

★ TLS everywhere; ★ secrets via KMS/manager; ★ data minimization; ★ deletion/export paths (§14).

---

## 11. Security Headers

| Header | Purpose |
|--------|---------|
| `Strict-Transport-Security` | Force HTTPS, prevent SSL-strip |
| `Content-Security-Policy` | Mitigate XSS/data-injection; restrict script/connect/frame sources |
| `X-Content-Type-Options: nosniff` | Stop MIME sniffing |
| `X-Frame-Options: DENY` / CSP `frame-ancestors 'none'` | Anti-clickjacking |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | Disable unused browser features (camera/mic/geo) |
| `Cross-Origin-Opener-Policy` / `-Embedder-Policy` / `-Resource-Policy` | Isolation, Spectre/side-channel hardening |
| `Cache-Control` (auth pages) | `no-store` on authenticated/sensitive responses |
| Remove `X-Powered-By` / server banners | Reduce fingerprinting |
| CORS (`Access-Control-Allow-Origin`) | **Explicit allowlist**, never `*` with credentials |

---

## 12. Logging & Monitoring

**Log (redacted):** auth events (login/logout/refresh/oauth callback), authZ failures (403/IDOR attempts), admin actions, connect/disconnect, sync runs, rate-limit hits, token-decrypt failures, 5xx.
**Monitor:** error/latency/5xx rates, queue depth, sync failure rate, upstream error spikes, auth-failure spikes, anomalous public-profile traffic.
**Alert (page on):** auth-failure spike (credential stuffing), token-decrypt failures (key/tamper), 403 spike (enumeration/IDOR scan), queue backlog, DB saturation, dependency CVE.
**Audit trail:** append-only, tamper-evident `audit_logs`; correlation via `requestId`/`jobId`.
**Intrusion detection:** WAF logs, anomaly rules, optional GuardDuty-style cloud IDS.
**Incident response:** see §20.5. ★ Never log secrets/tokens/PII.

---

## 13. Abuse Prevention

| Threat | Control |
|--------|---------|
| Brute force / credential stuffing | OAuth-only removes passwords; throttle OAuth/magic-link; account+IP backoff |
| Spam / fake accounts | GitHub identity raises the bar; per-account quotas; email-domain reputation (magic-link) |
| Bots / automated abuse | WAF bot rules; rate-limit; optional CAPTCHA on public profile/contact |
| Web scraping (public profile) | Rate-limit per IP, caching, no bulk export, robots policy, enumeration defense |
| Rate abuse / sync spam | Per-user sync quota + queue concurrency caps + cooldown |
| Resource exhaustion / DoS | Request size/time limits, queue caps, timeouts, CDN/WAF, autoscale with ceilings |
| Enumeration | Uniform 404s, rate-limit, no user-count oracles |

---

## 14. Privacy & Compliance

- ★ **Consent:** explicit consent at connect-time to fetch the user's own data + push to GitHub; clear scope display.
- ★ **Privacy policy + cookie notice:** already have Privacy/Terms pages; add a cookie banner if non-essential cookies are used (keep cookies essential → minimal banner).
- ★ **Data minimization:** store only handles + encrypted tokens + derived stats; **don't store solution code in the DB** (lives in GitHub).
- ★ **Right to delete:** account deletion → soft-delete → **purge tokens immediately**, scheduled hard purge; revoke GitHub/platform tokens.
- ★ **Data export:** provide user data export (connections, stats, settings) on request.
- ★ **GDPR/CCPA (if EU/CA users):** lawful basis = consent/contract; DPA with sub-processors (GitHub, hosting); data-residency awareness.
- 🟠 **ToS/legal note:** storing third-party platform **session tokens** may violate those platforms' ToS and carries liability — get explicit informed consent and document the risk; prefer official APIs where they exist (Codeforces) to reduce reliance on session cookies.

---

## 15. Dependency & Supply-Chain Security

- ★ **Lockfiles committed**; deterministic installs (`npm ci`).
- ★ **SCA** (Dependabot/Snyk) on PRs; block known-critical CVEs.
- ★ **Pin versions**; review transitive deps for the few high-risk ones (crypto, http, auth).
- ★ **Secret scanning** (gitleaks/GitHub secret scanning) in CI + pre-commit.
- ◇ **SBOM** generation; provenance/signing of build artifacts.
- ★ Minimize deps (the prototype proves CSS/SVG beats heavy chart libs → fewer deps = smaller surface).

---

## 16. CI/CD Security

- ★ **Secrets in CI vault** (encrypted), masked in logs; never echoed; least-privilege deploy creds (OIDC to cloud, no long-lived keys).
- ★ **Branch protection** on `main`: required PR + review + green checks; no force-push.
- ★ **Required checks:** lint, typecheck, tests, SCA, secret scan, SAST.
- ★ **Artifact integrity:** immutable, versioned artifacts; verify before deploy; optional signing.
- ★ **Pipeline least privilege:** separate build vs deploy roles; environment approvals for prod.
- ◇ **DAST** smoke against staging post-deploy.

---

## 17. Production Readiness Security Checklist

**Secrets & crypto**
- [ ] Platform + GitHub tokens envelope-encrypted (KMS); keys not in `.env`
- [ ] No secrets in repo/CI logs; secret scanning passing
- [ ] git-service **NOT** reachable from browser with a static key (S1 resolved)

**AuthN/Z**
- [ ] OAuth PKCE + state + redirect allowlist
- [ ] JWT verified on every protected route in **both** services
- [ ] Ownership checks (BOLA) on every object; field allowlists (mass assignment)
- [ ] Refresh rotation + reuse detection; logout revokes

**Edge & headers**
- [ ] TLS1.2+, HSTS, full security-header set, strict CORS allowlist
- [ ] CSP enforced (no inline/eval); cookies httpOnly+Secure+SameSite

**Input/output**
- [ ] All input schema-validated; upstream data sanitized before render/store
- [ ] Safe error envelopes (no stack traces/oracles)

**Abuse/limits**
- [ ] Rate limits on auth, public profile, sync trigger; queue caps + quotas
- [ ] SSRF egress allowlist; username strictly validated

**Data/privacy**
- [ ] Public profile exposes only public fields (no email/tokens)
- [ ] Delete purges tokens + revokes; export available; backups encrypted+restore-tested

**Ops**
- [ ] Redacted structured logs; audit trail; alerts wired
- [ ] Dependency SCA clean; branch protection + CI checks on
- [ ] Incident runbooks + on-call defined

---

## 18. Penetration Testing Plan (pre-launch)

| Area | Tests |
|------|-------|
| Authentication | OAuth flow tampering (state/PKCE/redirect), token forgery/expiry, magic-link replay/single-use, logout revocation |
| Authorization | BOLA (access others' connections/problems/sync via id), BFLA (user→admin), privilege escalation via mass assignment |
| Injection | SQL/Prisma raw, Redis key injection, SSRF via username, header/command injection |
| XSS | Stored (platform titles/usernames), DOM-XSS, markdown-render bypass, CSP effectiveness |
| CSRF | State-changing requests without token, SameSite bypass, OAuth callback CSRF |
| File upload | (only if built) type/MIME bypass, SVG-XSS, path traversal, oversize/zip-bomb |
| API | Excessive data exposure, enumeration on `/u/:username`, error-message oracles, version sprawl |
| Session | Fixation, replay, refresh-reuse detection, cookie flags, concurrent-session revoke |
| Business logic | Sync spam/abuse, connect another user's handle, quota bypass, expired-token handling |
| Performance under attack | Rate-limit + queue caps under load; DoS via sync flood; upstream-throttle behavior |
| Access control | Horizontal/vertical, default-deny on new routes, git-service trust boundary |
| Secrets | Token leakage in logs/responses/error pages; client-bundle secret scan |

> Run: SAST + SCA in CI, DAST/ZAP on staging, then a **manual pentest** focused on the token store, OAuth, BOLA, and the browser→git-service boundary.

---

## 19. Security Roadmap (prioritized)

**🔴 Critical — block launch**
- Resolve S1 (browser→git-service auth: user-JWT or BFF proxy)
- Envelope-encrypt all platform/GitHub tokens (S2) + KMS
- Minimize GitHub scope / per-repo (S3)
- Ownership checks everywhere (BOLA, S4) + field allowlists
- OAuth PKCE+state+redirect allowlist (S6); CSRF protection (S7)
- Secret hygiene: redacted logs, secret scanning, no client secrets (S5)
- TLS + core security headers + strict CORS
*Why:* each is a direct path to mass account takeover or full bypass.

**🟠 High**
- SSRF egress allowlist + username validation (S8)
- Rate limiting + sync quotas + queue caps (S11)
- Refresh rotation + reuse detection; session revoke
- SCA + Dependabot + branch protection + CI security checks
- Audit logging + alerting on auth-failure/IDOR/decrypt-failure
*Why:* high-likelihood attacks; needed for a trustworthy production service.

**🟡 Medium**
- Public-profile enumeration/scraping hardening + caching (S9)
- Upstream-content sanitization for XSS/markdown-injection (S10)
- Account export/delete completeness + token purge verification (S12)
- WAF/bot rules; CSP tightening with nonces
*Why:* meaningful but not immediate-catastrophe.

**🟢 Nice-to-have**
- Active-session/device management UI; trusted devices
- SBOM + artifact signing; cloud IDS
- CAPTCHA on public/contact; geo rules
*Why:* defense-in-depth enhancements.

---

## 20. Final Security Blueprint

### 20.1 Security architecture overview
```
            ┌──────────────── Zero-Trust boundaries ────────────────┐
[Browser]──TLS──▶ WAF/CDN ──▶ web-backend ──(JWT+ownership)──▶ DB(enc tokens)/Redis(auth)
   │  httpOnly cookie (JWT)            │  least-priv DB user
   └──TLS──▶ WAF/CDN ──▶ git-service ──(verify user JWT + ownership)──▶ platform/GitHub (egress allowlist)
                                       └─ workers decrypt tokens in-memory only (KMS), never log
Secrets: KMS/secret-manager · CI: scanned, least-priv deploy · Logs: redacted + audited
```

### 20.2 Threat model (STRIDE, key items)
| Threat | Example | Control |
|--------|---------|---------|
| **S**poofing | Forge sync caller / OAuth CSRF | JWT verify both services; state+PKCE |
| **T**ampering | Mass-assign role/userId; param tamper | Field allowlist; server-derived ids; validation |
| **R**epudiation | Deny destructive action | Audit logs (append-only) |
| **I**nfo disclosure | Token leak via logs/DB/public profile | Encryption, redaction, minimal public fields |
| **D**oS | Sync flood, scrape | Rate-limit, queue caps, WAF |
| **E**oP | User→admin, BOLA | RBAC + ownership checks |

### 20.3 Attack-surface analysis → see §1.1 (map) and §1.2 (component ranking).

### 20.4 Risk matrix (likelihood × impact)
```
Impact ▲
Critical │ S9          S2 S3 S1
High     │ S10 S12     S4 S5 S6 S7 S8
Medium   │             S11
Low      │
         └─────────────────────────────▶ Likelihood
            Low      Medium     High
```
*(S1–S3 high-likelihood + critical-impact = fix first.)*

### 20.5 Incident response recommendations
1. **Detect** — alerts on token-decrypt failures, auth-failure/IDOR spikes, anomalous egress.
2. **Contain** — kill switch to **pause all sync**, rotate KMS keys, revoke affected tokens, disable compromised service.
3. **Eradicate** — patch, invalidate sessions, force re-OAuth.
4. **Notify** — if external credentials exposed: notify users to rotate platform/GitHub tokens + regulators if PII (GDPR 72h).
5. **Recover** — restore from clean encrypted backup; verify integrity.
6. **Post-mortem** — blameless RCA; update controls + runbooks.
> Pre-write runbooks for: **token store breach**, **GitHub token abuse**, **dependency CVE**, **OAuth provider incident**, **queue/DoS**.

### 20.6 Long-term maintenance plan
- Quarterly: dependency/SCA review, key rotation, access review, pentest of new features.
- Continuous: SCA + secret scanning + SAST in CI; alert tuning.
- Per-release: threat-model delta for new endpoints; security checklist in DoD.
- Annually: full external pentest; restore-from-backup drill; IR tabletop exercise.

---

## ✅ Mandatory vs optional (at a glance)
- **Mandatory before launch:** token encryption (KMS), git-service auth boundary fix, GitHub scope minimization, BOLA/ownership + mass-assignment controls, OAuth PKCE/state/redirect, CSRF, TLS+headers+CORS, redacted logs + secret scanning, SSRF egress allowlist, rate limiting.
- **Strongly recommended:** refresh rotation+reuse detection, audit logging+alerts, SCA/branch protection, upstream-content sanitization, deletion/export completeness, **no avatar upload** (use GitHub avatar).
- **Optional / later:** session-device UI, SBOM+signing, WAF bot rules/CAPTCHA, cloud IDS, dark-mode-style enhancements.

> Next step when you ask: I can turn the **Critical** roadmap items into a step-by-step remediation checklist, or produce a focused threat model for a single flow (OAuth, or the Path B token lifecycle) — still no code.
