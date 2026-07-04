# 🏗️ CodeVault — Infrastructure Security

> Securing how CodeVault runs: Docker containers, reverse proxy, load balancing, private networking, and deployment strategy. Companion to [DEVOPS_PLAN](DEVOPS_PLAN.md), [CLOUD_SECURITY](CLOUD_SECURITY.md), and [SCALABILITY](SCALABILITY.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Run the three services (`web-frontend`, `web-backend`, `git-service`) plus Postgres + Redis on hardened, minimal, private-by-default infrastructure with safe deploys and rollbacks.

---

## 2. Architecture

```
Cloudflare (DNS+WAF+TLS) ─▶ Vercel (web-frontend: edge/SSR/ISR)
                          ─▶ LB ─▶ web-backend (N stateless replicas, :4000)
                          ─▶ LB ─▶ git-service API (N replicas, :5000)
                                    git-service workers (M, NO public ingress)
                                         │
                          Postgres (HA, private) · Redis (private) · KMS
```

Local dev uses **Docker Compose** (Colima engine) — Postgres `5433`, Redis `6380`, web-backend `4000`, git-service `5050` (host AirPlay owns 5000).

---

## 3. Best Practices

- **Multi-stage Dockerfiles**: build stage → slim runtime; **non-root** user; only `dist` + prod deps shipped.
- **Private networking**: DB/Redis/workers in private subnets; only the LB is public.
- **Immutable artifacts**: versioned images, deploy by digest, never mutate running containers.
- **Health-gated deploys**: `/health` + `/ready` gate traffic; blue-green or rolling.
- **Default-deny egress**: allowlist platform + GitHub hosts (anti-SSRF).

---

## 4. Threats

Container breakout / root containers · secrets baked into images · public DB/Redis · supply-chain image vulns · privileged ports · bad migration on the token store · deploy with no rollback.

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| Root container | `USER app` non-root; drop capabilities; read-only FS where possible |
| Secrets in image | `.dockerignore` excludes `.env`; secrets via env/secret manager at runtime |
| Public datastores | private subnets; security groups to app only |
| Image vulns | scan images in CI; pin base (`node:20-alpine`); minimal layers |
| Bad migration | expand→contract; pre-migration backup; staging first; prod approval gate |
| No rollback | immutable artifacts + one-command redeploy of previous digest |

---

## 6. Implementation Guidelines

- Compose `depends_on: condition: service_healthy` so apps wait for DB/Redis.
- In-container services reach data layer by **service name** (`postgres:5432`, `redis:6379`); host ports differ to avoid local clashes.
- Workers run as a separate process/container with no exposed port.
- Reverse proxy (Cloudflare/Nginx/Caddy) terminates TLS, normalizes headers, enforces request size/time limits.

---

## 7. Folder Structure

```
docker-compose.yml            # postgres, redis, web-backend, git-service
docker-compose.override.yml   # dev hot-reload bind mounts
web-backend/Dockerfile        # multi-stage (dev/builder/non-root prod)
git-service/Dockerfile        # multi-stage
*/.dockerignore               # exclude node_modules, .env, tests
.env.docker.example           # compose env template
```

---

## 8. Recommended Libraries / Tools

Docker / Colima (local), Terraform (IaC), Cloudflare, Vercel, a container PaaS (Render/Fly/ECS), `tfsec`/`trivy` (scanning), Nginx or Caddy (proxy).

---

## 9. Configuration Examples

```dockerfile
FROM node:20-alpine AS production
RUN apk add --no-cache openssl && addgroup -S app && adduser -S app -G app
USER app
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

```yaml
depends_on:
  postgres: { condition: service_healthy }
  redis:    { condition: service_healthy }
```

---

## 10. Production Considerations

- **Terraform** per-environment workspaces; remote, locked, encrypted state; `prevent_destroy` on prod DB/KMS.
- Auto-scaling: API on CPU/RPS, **workers on queue depth**.
- HSTS preload, TLS 1.2+, DNSSEC, CAA (see [CLOUD_SECURITY](CLOUD_SECURITY.md)).
- Break-glass, audited prod access only.

---

## 11. Future Improvements

- Distroless or scratch runtime images.
- Read-only root filesystem + seccomp/AppArmor profiles.
- Service mesh (mTLS) if internal calls grow.
- Canary deploys for git-service workers.

---

## 12. Checklist

- [ ] Multi-stage, non-root images; `.dockerignore` excludes secrets
- [ ] DB/Redis/workers private; only LB public
- [ ] Images scanned + pinned in CI
- [ ] Health/readiness-gated blue-green/rolling deploys
- [ ] Default-deny egress + allowlist
- [ ] IaC with locked state; prod approval gate; `prevent_destroy`
- [ ] Pre-migration backup; tested rollback
- [ ] Reverse proxy enforces TLS + size/time limits

---

## 13. References

- [DEVOPS_PLAN.md](DEVOPS_PLAN.md) · [CLOUD_SECURITY.md](CLOUD_SECURITY.md) · [SCALABILITY.md](SCALABILITY.md) · [SECRETS.md](SECRETS.md)
- Docker security best practices · CIS Benchmarks · Terraform recommended practices


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [ ] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
