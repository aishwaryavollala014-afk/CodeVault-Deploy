# 🐙 CodeVault — GitHub Integration Security

> Securing CodeVault's two GitHub touchpoints: **sign-in** (OAuth) and **code push** (the `git-service` sync engine writing to the user's repo). Companion to [AUTH_SECURITY](AUTH_SECURITY.md), [QUEUE_SECURITY](QUEUE_SECURITY.md), and [SECRETS](SECRETS.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

GitHub is both an identity provider and a **write target** on the user's own repositories — a supply-chain-sensitive capability. This doc minimizes scope, encrypts tokens, and verifies everything (repos, webhooks, commits).

---

## 2. Architecture

```
Sign-in:  OAuth code → access token → encrypted in oauth_identities (AES-256-GCM)
Sync:     git-service decrypts token in-memory → Git Data API (blobs → tree → commit → ref) → one commit/run
```

The same encrypted GitHub token is reused by git-service to push; it is **never** returned to the browser.

---

## 3. Best Practices

- **Least scope:** request `repo` minimally; prefer **per-repo, fine-grained** access via a future GitHub App.
- **Encrypt tokens at rest** (envelope, `keyVersion` for rotation); decrypt in-memory only, never log.
- **Verify the target repo** belongs to the authenticated user before pushing.
- **One commit per sync run** (batch via Git Data API) — clean history, fewer calls.
- **Respect rate limits** (5,000/hr authenticated); pause at low remaining budget.

---

## 4. Threats

Over-broad token writing to **all** the user's repos · token theft → repo tampering (supply-chain) · pushing to a repo the user doesn't own · webhook spoofing (future) · secret leakage into committed files · GitHub API abuse / rate-limit exhaustion.

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| Over-broad scope | minimize scopes; migrate to GitHub App with per-repo permissions |
| Token theft | envelope encryption + KMS; in-memory only; redact logs; revoke on logout/delete |
| Wrong-repo push | validate `repoFullName` ownership against the authenticated GitHub identity |
| Webhook spoofing | verify `X-Hub-Signature-256` HMAC (timing-safe) + delivery id replay guard |
| Secret leakage in commits | enable **push protection** + **secret scanning** on synced repos; never sync `.env` |
| Rate-limit abuse | monitor `X-RateLimit-Remaining`; pause at <100; batch commits |

---

## 6. Implementation Guidelines

- `lib/github.ts` builds a per-call authed axios instance (token in memory, request-scoped).
- `github.service.ts` performs the batch commit; `readme.generator.ts` rebuilds the index.
- Token rotation: re-OAuth refreshes the encrypted token; `keyVersion` enables key rotation without downtime.
- Sanitize platform-sourced `question.md` content before committing (anti stored-XSS in rendered markdown).

---

## 7. Folder Structure

```
web-backend/src/services/auth.service.ts     # stores encrypted GitHub token (oauth_identities)
git-service/src/lib/github.ts                 # authed GitHub API client
git-service/src/services/github/
├── github.service.ts                         # Git Data API batch push, readFile, listCommits
└── readme.generator.ts                       # repo index README
git-service/src/services/sync.service.ts      # decrypts token, orchestrates push
```

---

## 8. Recommended Libraries

`axios` (REST), Node `crypto` (HMAC webhook verify, token decrypt). Optional: `@octokit/rest` / `@octokit/webhooks` if richer GitHub features are added; `@octokit/auth-app` for GitHub App.

---

## 9. Configuration Examples

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...          # never committed; secret manager in prod
# Future GitHub App:
# GITHUB_APP_ID=...
# GITHUB_APP_PRIVATE_KEY=...      # PEM in secret manager
# GITHUB_WEBHOOK_SECRET=...
```

```ts
// Webhook signature verification (future)
const mac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(`sha256=${mac}`));
```

---

## 10. Production Considerations

- Store GitHub secrets in a **secret manager** (not `.env`); rotate on suspicion/annually.
- Enable **secret scanning + push protection** on the org/repos CodeVault writes to.
- Budget ~3 API calls per new problem; throttle bulk first-syncs.
- Audit every connect/disconnect/push in `audit_logs`.

---

## 11. Future Improvements

- Migrate OAuth App → **GitHub App** (fine-grained, per-repo, PKCE, higher limits).
- Webhook-driven incremental sync if/when supported.
- Signed commits (GPG/Sigstore) for provenance.

---

## 12. Checklist

- [x] GitHub token envelope-encrypted; in-memory only; never logged/returned
- [x] Minimal scope requested *(per-repo via GitHub App pending)*
- [x] Repo push-access verified before push *(verifyRepoAccess in sync.service)*
- [x] One commit per run via Git Data API
- [ ] Rate-limit budget monitored; bulk sync throttled *(not yet)*
- [ ] Secret scanning + push protection on target repos *(deploy/config-time)*
- [ ] Webhook HMAC verification (when added) *(no webhooks yet)*
- [x] Token purged on account delete; rotation supported *(deleteMe hard-purges oauth_identities; keyVersion rotation ready)*

---

## 13. References

- [AUTH_SECURITY.md](AUTH_SECURITY.md) · [QUEUE_SECURITY.md](QUEUE_SECURITY.md) · [SECRETS.md](SECRETS.md) · [PLATFORM_INTEGRATION.md](PLATFORM_INTEGRATION.md) §5
- GitHub REST/Git Data API · GitHub Apps · Webhooks: securing payloads


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [x] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
