<div align="center">

# 📚 CodeVault — Documentation Index

### Every doc in this folder, grouped by purpose.

</div>

> New here? Start with **[FEATURES.md](FEATURES.md)** for what CodeVault does today, then **[ARCHITECTURE.md](ARCHITECTURE.md)** for how the pieces fit.
> Service-level docs live in each service's own `README.md` (`web-backend/`, `git-service/`, `web-frontend/`, `browser-extension/`, `database/`).

---

## 🚀 Start here

| Doc | What it covers |
|-----|----------------|
| [FEATURES.md](FEATURES.md) | **Full feature catalog** — every feature, its real build status (✅/🟠/⛔), owner, and code location. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System topology, layers, request/data lifecycles, the two data paths. |
| [ROADMAP.md](ROADMAP.md) | Consolidated M0–M6 milestones. |
| [TEAM_PLAN.md](TEAM_PLAN.md) | Ownership split (Aishwarya ↔ Gaurav) and git workflow. |
| [TECH_STACK.md](TECH_STACK.md) | Canonical stack + versions and upgrade rationale. |
| [FAQ.md](FAQ.md) | Common questions about the product and approach. |

## 🏗 Architecture & build plans

| Doc | What it covers |
|-----|----------------|
| [BACKEND_PLAN.md](BACKEND_PLAN.md) | web-backend build blueprint. |
| [FRONTEND_PLAN.md](FRONTEND_PLAN.md) | web-frontend build blueprint. |
| [DATABASE_PLAN.md](DATABASE_PLAN.md) | Schema, ERD, indexing, scalability. |
| [DBMS_CONCEPTS.md](DBMS_CONCEPTS.md) | Every DBMS topic → CodeVault artifact (SQL in `../database/`). |
| [API_CONTRACT.md](API_CONTRACT.md) | Frozen FE↔BE contract — endpoints, models, errors. |
| [PLATFORM_INTEGRATION.md](PLATFORM_INTEGRATION.md) | LeetCode / CF / CC / HR + GitHub integration specs. |
| [EXTENSION_PLAN.md](EXTENSION_PLAN.md) | Browser extension blueprint (Path B v2). |
| [DEVOPS_PLAN.md](DEVOPS_PLAN.md) | Delivery & environments. |
| [TESTING_PLAN.md](TESTING_PLAN.md) | QA strategy. |
| [OBSERVABILITY_PLAN.md](OBSERVABILITY_PLAN.md) | Monitoring & tracing strategy. |

## 🛡 Security & operations

| Doc | Topic |
|-----|-------|
| [SECURITY_PLAN.md](SECURITY_PLAN.md) | Master security blueprint (OWASP, threat model). |
| [AUTH_SECURITY.md](AUTH_SECURITY.md) | OAuth, JWT, refresh rotation, RBAC. |
| [API_SECURITY.md](API_SECURITY.md) | OWASP API Top 10, idempotency, HMAC. |
| [BACKEND_SECURITY.md](BACKEND_SECURITY.md) | Express hardening, validation, errors. |
| [DATABASE_SECURITY.md](DATABASE_SECURITY.md) | Postgres, encryption, roles, backups. |
| [REDIS_SECURITY.md](REDIS_SECURITY.md) | ACL, TLS, caching, locks. |
| [QUEUE_SECURITY.md](QUEUE_SECURITY.md) | BullMQ, DLQ, backoff, locking. |
| [GITHUB_SECURITY.md](GITHUB_SECURITY.md) | OAuth, token encryption, webhooks. |
| [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md) | Extension token scoping, least-privilege manifest, ingest validation. |
| [FILE_UPLOAD_SECURITY.md](FILE_UPLOAD_SECURITY.md) | No-upload default + hardened blueprint. |
| [INFRASTRUCTURE_SECURITY.md](INFRASTRUCTURE_SECURITY.md) | Docker, networking, deploys. |
| [CLOUD_SECURITY.md](CLOUD_SECURITY.md) | Cloudflare WAF, DDoS, TLS, bots. |
| [SECRETS.md](SECRETS.md) | Env, KMS, rotation, validation. |
| [MONITORING.md](MONITORING.md) | Metrics, logging, security alerts. |
| [DEVSECOPS.md](DEVSECOPS.md) | CI/CD security, scanning, supply chain. |
| [SECURE_DEVELOPMENT.md](SECURE_DEVELOPMENT.md) | Dev & AI security practices, local setup. |
| [SECURITY_TESTING.md](SECURITY_TESTING.md) | BOLA/CSRF/SSRF suites, DAST, pentest. |
| [ATTACK_PREVENTION.md](ATTACK_PREVENTION.md) | 40+ attacks mapped to CodeVault. |
| [SCALABILITY.md](SCALABILITY.md) | Stateless scaling, caching, replicas. |
| [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) | Backups, PITR, RTO/RPO, failover. |
| [COMPLIANCE.md](COMPLIANCE.md) | GDPR-ready, deletion, retention. |

---

<div align="center">

Keep this index in sync — when you add a doc here, add its row above **in the same commit**.

</div>
