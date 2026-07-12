# 🔑 CodeVault — Secrets Management

> How CodeVault stores, rotates, and protects its secrets — the crown jewels being `JWT_SECRET`, `ENCRYPTION_KEY`, GitHub OAuth credentials, and DB/Redis URLs. Companion to [SECURITY_PLAN](SECURITY_PLAN.md) (§5, §10), [DATABASE_SECURITY](DATABASE_SECURITY.md), and [GITHUB_SECURITY](GITHUB_SECURITY.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Ensure secrets never land in git, logs, images, or the client bundle — and can be rotated without downtime. CodeVault's encryption depends on two keys being correct and **shared** between services.

---

## 2. Architecture

```
local dev:  .env (gitignored) per service
CI:         encrypted GitHub Actions secrets (masked)
prod:       secret manager (Vault / cloud SM) → injected at runtime; master key in KMS
```

`JWT_SECRET` and `ENCRYPTION_KEY` are **identical** in `web-backend` and `git-service` (one verifies the other's JWTs; one decrypts what the other encrypted).

---

## 3. Best Practices

- **Never commit secrets** — `.gitignore` covers `.env`/`.env.*` (keeps `.env.example`).
- **Validate at boot** (`config/env.ts`, Zod) — fail-fast on missing/malformed secrets.
- **Environment separation**: distinct secret sets for dev/test/staging/prod.
- **Least privilege**: per-service DB roles; scoped API keys.
- **Rotation**: `keyVersion` on encrypted columns enables zero-downtime key rotation.

---

## 4. Threats

Secret in repo/CI logs · secret in Docker image · `NEXT_PUBLIC_*` leak of a real secret to the browser · `ENCRYPTION_KEY` mismatch (decrypt failures) · stale long-lived credentials · over-broad cloud IAM.

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| Repo leakage | `.gitignore` + gitleaks (CI + pre-commit) |
| CI log leakage | masked secrets; never `echo`; OIDC short-lived tokens |
| Image leakage | `.dockerignore` excludes `.env`; runtime injection only |
| Client bundle leak | only non-secret `NEXT_PUBLIC_*`; git-service key never reaches browser |
| Key mismatch | single source of truth for shared keys; deploy both services together |
| Stale creds | scheduled rotation; revoke on suspicion |

---

## 6. Implementation Guidelines

- `config/env.ts` lists every required secret; the app **won't boot** if any is missing.
- Generate `ENCRYPTION_KEY` as base64 of 32 random bytes (`openssl rand -base64 32`).
- Generate `JWT_SECRET` as 32+ random bytes.
- For rotation: deploy new `keyVersion`, decrypt-old/re-encrypt-new in a background job, then retire the old key.

---

## 7. Folder Structure

```
web-backend/.env.example   # documents required vars (committed)
git-service/.env.example   # documents required vars (committed)
.env.docker.example        # compose data-layer vars
.gitignore                 # ignores .env, .env.* (keeps *.example)
*/src/config/env.ts        # Zod validation, fail-fast
```

---

## 8. Recommended Tools

HashiCorp Vault or a cloud secret manager (AWS SM / GCP SM / Doppler), KMS for the master key, GitHub Actions encrypted secrets, `gitleaks`.

---

## 9. Configuration Examples

```env
JWT_SECRET=<openssl rand -hex 32>            # SAME in both services
ENCRYPTION_KEY=base64:<openssl rand -base64 32>   # SAME in both services
GITHUB_CLIENT_SECRET=...                      # secret manager in prod
DATABASE_URL=postgresql://cv_web:***@db:5432/codevault?sslmode=verify-full
```

---

## 10. Production Considerations

- Master encryption key in **KMS**; app fetches data keys, never sees the master.
- Rotate `JWT_SECRET` with a dual-key acceptance window (old+new) to avoid mass logout.
- Audit secret access; alert on anomalous reads.
- Backups contain **ciphertext only**; keys stored separately.

---

## 11. Future Improvements

- Automated key rotation pipeline driven by `keyVersion`.
- Dynamic DB credentials (Vault database secrets engine).
- Per-environment KMS keys with separate IAM.

---

## 12. Checklist

- [x] `.env`/`.env.*` gitignored; `.env.example` committed
- [x] gitleaks in CI *(.github/workflows/ci.yml + .gitleaks.toml; pre-commit hook optional)*
- [x] Boot-time validation (fail-fast) for all secrets
- [x] `JWT_SECRET` + `ENCRYPTION_KEY` identical across services
- [x] No real secret in `NEXT_PUBLIC_*` / client bundle
- [x] `.dockerignore` excludes `.env`; runtime injection via compose
- [ ] Prod secrets in manager; master key in KMS *(deploy-time)*
- [ ] Rotation plan via `keyVersion`; dual-key JWT window *(`keyVersion` columns ready; rotation process not built)*

---

## 13. References

- [SECURITY_PLAN.md](SECURITY_PLAN.md) §5, §10 · [DATABASE_SECURITY.md](DATABASE_SECURITY.md) · [GITHUB_SECURITY.md](GITHUB_SECURITY.md) · [DEVSECOPS.md](DEVSECOPS.md)

---

## 14. Environment-variable contract (captured before skeleton reset — 2026-06-27)

> Both `.env.example` files were emptied. The exact env contract (validated at boot by each `config/env.ts`, fail-fast) is preserved here. `.env` itself was never committed (gitignored) and is left untouched locally. Build scripts captured too.

### web-backend (`PORT=4000`)
```env
NODE_ENV=development            # development | production
PORT=4000
LOG_LEVEL=debug
DATABASE_URL=postgresql://codevault:codevault@localhost:5432/codevault   # Docker overrides host→postgres
REDIS_URL=redis://localhost:6379
# CROWN JEWELS — never commit real values:
JWT_SECRET=<long random>        # shared with git-service (same-JWT verify)
JWT_ACCESS_TTL=1800             # 30 min
JWT_REFRESH_TTL=1209600         # 14 days
ENCRYPTION_KEY=base64:<32-byte> # AES-256-GCM envelope key for platform/GitHub tokens
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/auth/github/callback
CORS_ORIGIN=http://localhost:3000
```
Scripts: `dev`=nodemon · `build`=`prisma generate && tsc` · `start`=`node dist/index.js` · `typecheck` · `lint` · `prisma:generate|migrate|deploy|studio`.

### git-service (`PORT=5050` local; binds 5000 in Docker)
```env
NODE_ENV=development
PORT=5050                        # macOS AirPlay owns 5000 locally
LOG_LEVEL=debug
DATABASE_URL=postgresql://codevault:codevault@localhost:5433/codevault   # SAME DB; writes only problems + sync_runs
REDIS_URL=redis://localhost:6380
JWT_SECRET=<must match web-backend>        # verify the user's access token
ENCRYPTION_KEY=base64:<must match web-backend>  # DECRYPT platform/GitHub tokens
SYNC_CRON=0 */6 * * *
SYNC_CONCURRENCY=3
SYNC_PLATFORM_CONCURRENCY=2
SYNC_ENABLED=true                # kill switch — false pauses scheduler + manual sync
CORS_ORIGIN=http://localhost:3000
```
Scripts: `dev`=nodemon · `build`=`prisma generate && tsc` · `start` · `typecheck` · `lint` · `prisma:generate`.

> Local host ports: Postgres 5433, Redis 6380, web-backend 4000, git-service 5050. `JWT_SECRET` + `ENCRYPTION_KEY` **must be identical** across both services.
- OWASP Secrets Management Cheat Sheet · 12-Factor App: Config


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [x] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
