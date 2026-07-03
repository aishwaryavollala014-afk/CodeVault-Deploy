# 🛡️ CodeVault — Attack Prevention Reference

> A comprehensive, CodeVault-specific reference for every major web attack: what it is, how it works, real-world impact, prevention, detection, and how CodeVault defends against it. Companion to [SECURITY_PLAN](SECURITY_PLAN.md), [BACKEND_SECURITY](BACKEND_SECURITY.md), [AUTH_SECURITY](AUTH_SECURITY.md), and [API_SECURITY](API_SECURITY.md).

**Per-attack format:** *What/How · Example & Impact · Prevention & Detection · In CodeVault.*
CodeVault context: Next.js frontend · two Express/TS backends (`web-backend`, `git-service`) · PostgreSQL + Prisma · Redis + BullMQ · Cloudflare · GitHub OAuth + sync.

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Injection

### SQL Injection
- **What/How:** Untrusted input concatenated into SQL alters the query (auth bypass, data dump).
- **Impact:** Full DB read/write; with the token store, mass external-account takeover.
- **Prevention/Detection:** Parameterized queries only; ORM; least-privilege roles; WAF; query anomaly logs.
- **In CodeVault:** Prisma parameterizes everything; `queryRawUnsafe` forbidden (lint/review); per-service DB roles.

### Command Injection
- **What/How:** Input flows into a shell command (`exec`), running attacker commands.
- **Impact:** RCE on the host.
- **Prevention/Detection:** Never shell out with user input; use library APIs; allowlist; egress monitoring.
- **In CodeVault:** No shell execution in request paths; GitHub writes go through the REST API, not `git` CLI.

### Log Injection
- **What/How:** Newlines/control chars in input forge or corrupt log lines.
- **Impact:** Tampered audit trail, log-parser exploits.
- **Prevention/Detection:** Structured JSON logging (no string concat); encode untrusted fields.
- **In CodeVault:** `pino` structured logs; user input is a field value, never interpolated into the message.

---

## 2. Cross-Site Scripting (XSS)
- **What/How:** Injected script executes in a victim's browser (stored/reflected/DOM).
- **Example & Impact:** Stored `<script>` in a platform problem title → session/UI compromise.
- **Prevention/Detection:** Output encoding; sanitize untrusted HTML; CSP; avoid `dangerouslySetInnerHTML`.
- **In CodeVault:** React escaping; platform-sourced `question.md`/titles sanitized before store/render; `CodeBlock` renders as text; strict CSP (FE).

## 3. Cross-Site Request Forgery (CSRF)
- **What/How:** Victim's browser is tricked into sending an authenticated state-changing request.
- **Impact:** Forged connects/disconnects/syncs.
- **Prevention/Detection:** `SameSite` cookies + anti-CSRF token; OAuth `state`; origin checks.
- **In CodeVault:** httpOnly `SameSite=Lax` cookies; OAuth `state` (Redis, single-use); CSRF token on mutations (FE).

## 4. Server-Side Request Forgery (SSRF)
- **What/How:** App is coerced into fetching attacker-chosen internal URLs.
- **Impact:** Access to metadata endpoints / internal services / pivot.
- **Prevention/Detection:** Validate inputs; **outbound host allowlist**; block RFC1918/link-local/metadata IPs; no user-controlled full URLs.
- **In CodeVault:** Strict username regex (`platform.validator.ts`); platform hosts hard-coded; git-service egress allowlist.

---

## 4b. Remote Code Execution (RCE)
- **What/How:** Attacker runs arbitrary code (deserialization, template/command injection, vuln dep).
- **Impact:** Full server compromise.
- **Prevention/Detection:** No `eval`/dynamic require on input; patch deps (SCA); non-root containers; SAST.
- **In CodeVault:** No dynamic code execution on input; CodeQL/Semgrep; Dependabot; least-privilege runtime.

## 5. Directory / Path Traversal
- **What/How:** `../` sequences escape intended directories.
- **Impact:** Read/write arbitrary files; here, writing outside the intended repo folder.
- **Prevention/Detection:** Sanitize/derive paths; never use raw input as a path; canonicalize + check prefix.
- **In CodeVault:** `padNumber`/`slugify` derive folder/file names; raw platform strings never used as paths.

## 6. File Inclusion (LFI/RFI)
- **What/How:** Dynamic include of local/remote files via input.
- **Impact:** Source disclosure / RCE.
- **Prevention/Detection:** No dynamic includes from input; allowlist modules.
- **In CodeVault:** Static imports only; no template/file inclusion driven by user input.

## 7. XML External Entity (XXE)
- **What/How:** XML parser resolves external entities → file read/SSRF.
- **Impact:** Local file disclosure, SSRF.
- **Prevention/Detection:** Disable external entities; prefer JSON.
- **In CodeVault:** JSON-only APIs (`express.json`); no XML parsing.

## 8. Insecure Deserialization
- **What/How:** Untrusted serialized objects instantiate dangerous types.
- **Impact:** RCE, object injection.
- **Prevention/Detection:** No native deserialization of untrusted data; schema-validate JSON.
- **In CodeVault:** Zod-validated JSON; no `node-serialize`/pickle-style deserialization.

## 9. Prototype Pollution
- **What/How:** `__proto__`/`constructor` keys mutate `Object.prototype`.
- **Impact:** Logic bypass, DoS, sometimes RCE.
- **Prevention/Detection:** `.strict()` schemas; avoid recursive merge of untrusted objects; null-proto maps.
- **In CodeVault:** Zod `.strict()` parsing; no deep-merge of request bodies.

---

## 10. Authentication & Session Attacks

### Session Hijacking
- **What/How:** Stealing a session token (XSS, sniffing) to impersonate.
- **Prevention:** httpOnly+Secure cookies; TLS; short TTL; rotation. **CodeVault:** access JWT in httpOnly cookie, ~30 min, refresh rotation.

### Session Fixation
- **What/How:** Force a known session id, then ride it post-login.
- **Prevention:** New session/token on login + refresh. **CodeVault:** new session id every login/refresh.

### Credential Stuffing / Brute Force / Password Spraying
- **What/How:** Replaying leaked creds / guessing passwords at scale.
- **Prevention:** Passwordless; throttle; CAPTCHA; lockout. **CodeVault:** OAuth-only (no passwords); rate-limit `/auth/*`; Cloudflare challenge.

### OAuth Token Theft
- **What/How:** Intercept the OAuth code/token (CSRF, open redirect).
- **Prevention:** `state`, redirect allowlist, TLS. **CodeVault:** single-use `state` in Redis; callback allowlisted.

### JWT Attacks
- **What/How:** `alg=none`, weak secret, unverified signature, type confusion.
- **Prevention:** Pin algorithm; strong secret; verify sig+exp+type. **CodeVault:** HS256 fixed; reject wrong `type`; strong shared secret.

### Broken Authentication
- **What/How:** Flawed login/session lets attackers in.
- **Prevention:** Vetted OAuth flow; verify everywhere. **CodeVault:** both services verify the same JWT; default-deny on protected routes.

---

## 11. Authorization Attacks

### Broken Access Control / IDOR
- **What/How:** Accessing another user's object by changing an id.
- **Impact:** Cross-user data read/modify.
- **Prevention:** Ownership checks from the token; non-enumerable ids; default-deny.
- **In CodeVault:** `req.user.id` from JWT only; every query filters `userId`; **cuid** ids; verified manually (foreign ids → 401/403).

### Mass Assignment
- **What/How:** Extra fields (`role`,`plan`) in a body set privileged attributes.
- **Prevention:** Field allowlists; server-controlled fields.
- **In CodeVault:** `.strict()` DTOs reject unknown keys (verified: `role` injection → `400`).

---

## 12. Client-Side & Browser Attacks

### Clickjacking
- **What/How:** Victim UI framed and click-hijacked.
- **Prevention:** `frame-ancestors 'none'` + `X-Frame-Options: DENY`. **CodeVault:** set via Helmet/CSP.

### DNS Rebinding
- **What/How:** Attacker domain rebinds to internal IPs to bypass SOP.
- **Prevention:** Host header validation; bind to expected hosts; egress controls. **CodeVault:** fixed origins/CORS allowlist; no localhost-trusting endpoints.

### Cache Poisoning
- **What/How:** Polluting shared caches with malicious/foreign responses.
- **Prevention:** Correct cache keys/vary; never cache authed responses. **CodeVault:** cache keys include `userId`/`handle`; authed responses `no-store`.

---

## 13. Protocol & Network Attacks

### HTTP Request Smuggling / Response Splitting
- **What/How:** Ambiguous/forged framing desyncs proxy↔origin or injects headers.
- **Prevention:** Consistent HTTP stack; reject CRLF in headers; trusted proxy. **CodeVault:** Cloudflare + standard Express; no header values from raw input.

### Man-in-the-Middle (MITM)
- **What/How:** Intercepting unencrypted traffic.
- **Prevention:** TLS everywhere; HSTS; cert pinning where feasible. **CodeVault:** TLS at edge + to DB/Redis (`verify-full`); HSTS preload.

### Replay Attacks
- **What/How:** Re-sending a captured valid request.
- **Prevention:** Short token TTL; nonces; timestamps; idempotency. **CodeVault:** single-use OAuth `state`; short JWT TTL; refresh reuse detection; idempotent sync.

### Race Conditions
- **What/How:** Concurrent ops on shared state produce inconsistent results (double sync, double spend).
- **Prevention:** Locks; unique constraints; transactions.
- **In CodeVault:** per-connection Redis lock + unique `(userId,platform,slug)` upsert.

---

## 14. API, GraphQL & Realtime

### API Abuse
- **What/How:** Automated misuse of business flows (mass connect/sync).
- **Prevention:** Rate limits, quotas, bot defense. **CodeVault:** Redis rate-limit + queue caps + per-user cooldown + Cloudflare.

### GraphQL Abuse
- **What/How:** Deep/expensive queries, introspection abuse.
- **Prevention:** Depth/complexity limits; disable introspection in prod. **CodeVault:** No GraphQL server exposed (REST only); *consuming* LeetCode GraphQL is outbound + rate-limited.

### WebSocket Attacks
- **What/How:** Unauthenticated/abused socket connections.
- **Prevention:** Authn handshake; origin checks; rate limits. **CodeVault:** No public WebSocket surface today; if added, JWT handshake + origin allowlist.

---

## 15. Volumetric & Bot

### Bot / Spam Attacks
- **Prevention:** Bot management, CAPTCHA, rate-limit. **CodeVault:** Cloudflare Bot Mgmt + per-IP limits on `/public`, `/auth`, contact.

### DDoS (L3/L4/L7)
- **What/How:** Flood network/transport/app to exhaust capacity.
- **Prevention:** CDN/WAF absorption; autoscale with ceilings; rate rules.
- **In CodeVault:** Cloudflare L3/L4 auto + L7 rate rules; app-level Redis limits; queue caps.

---

## 16. Supply Chain & Dependencies

### Supply Chain Attacks
- **Prevention:** Lockfiles, SCA, pin actions by SHA, SBOM, signing. **CodeVault:** Dependabot, gitleaks, CodeQL, pinned actions, minimal deps.

### Dependency Confusion
- **Prevention:** Scoped names; private registry config; lockfile integrity. **CodeVault:** committed lockfiles; verify registry source.

### Typosquatting
- **Prevention:** Review new deps; verify package names/authors. **CodeVault:** PR review of dependency additions.

### Zero-Day Exploits
- **Prevention:** Defense in depth; rapid patching; WAF virtual-patching; least privilege. **CodeVault:** layered controls so one flaw isn't catastrophic; fast Dependabot patch cadence.

---

## 17. Secrets, Logging & Comms

### Secret Leakage
- **Prevention:** gitignore + scanning; no secrets in logs/bundle. **CodeVault:** `.env` ignored, gitleaks, pino redaction, only `NEXT_PUBLIC_*` to browser. (See [SECRETS](SECRETS.md).)

### Email Spoofing / Phishing
- **Prevention:** SPF/DKIM/DMARC; user education; don't send sensitive links. **CodeVault:** transactional email (if added) with SPF/DKIM/DMARC; GitHub handles auth emails.

---

## 18. Upload & Content (defense-by-avoidance)

### Malware Uploads / Zip Bombs / Image-based Exploits
- **Prevention:** Avoid uploads; if needed, sniff + scan + re-encode + limits. **CodeVault:** **no user uploads** (avatar = GitHub URL). See [FILE_UPLOAD_SECURITY](FILE_UPLOAD_SECURITY.md).

---

## 19. Master Prevention Checklist

- [ ] Injection: ORM/parameterized; no `queryRawUnsafe`; no shell on input
- [ ] XSS: React escaping + sanitize upstream HTML + CSP
- [ ] CSRF: SameSite + token + OAuth state
- [ ] SSRF: input validation + egress allowlist + block internal IPs
- [ ] AuthZ: ownership from JWT; cuid ids; field allowlists (BOLA + mass assignment)
- [ ] AuthN: OAuth state, JWT verify (both services), refresh rotation + reuse detection
- [ ] Sessions: httpOnly+Secure+SameSite, short TTL, new id on login/refresh
- [ ] Replay/Race: single-use state, idempotency, per-connection lock, unique constraints
- [ ] Transport: TLS everywhere, HSTS, verify-full to DB/Redis
- [ ] Headers: Helmet, CSP, frame-ancestors none, no-store on authed
- [ ] Volumetric: Cloudflare WAF/DDoS/Bot + Redis rate limits + queue caps
- [ ] Supply chain: lockfiles, SCA, pinned actions, secret scanning, SBOM
- [ ] Secrets: gitignore + scanning + redaction; nothing in client bundle
- [ ] Uploads: none (avoidance); hardened blueprint if ever added
- [ ] Deserialization/XXE/Prototype: JSON-only, Zod `.strict()`, entities disabled

---

## 20. References

- [SECURITY_PLAN.md](SECURITY_PLAN.md) · [BACKEND_SECURITY.md](BACKEND_SECURITY.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md) · [API_SECURITY.md](API_SECURITY.md) · [CLOUD_SECURITY.md](CLOUD_SECURITY.md) · [SECRETS.md](SECRETS.md) · [FILE_UPLOAD_SECURITY.md](FILE_UPLOAD_SECURITY.md) · [SECURITY_TESTING.md](SECURITY_TESTING.md)
- OWASP Top 10 (2021) · OWASP API Security Top 10 (2023) · OWASP Cheat Sheet Series · MITRE CWE
