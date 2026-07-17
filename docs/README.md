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
| [PROGRESS.md](PROGRESS.md) | **Progress checklist** — what's done / partial / pending, with % per area, verified against code. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System topology, layers, request/data lifecycles, the two data paths. |
| [ROADMAP.md](ROADMAP.md) | Consolidated M0–M6 milestones. |
| [FUTURE_IMPLEMENTATION_TASKS.md](FUTURE_IMPLEMENTATION_TASKS.md) | Forward task list (reconciled with what's already built). |
| [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) | Market/strengths/risks analysis + strategic next steps. |
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

## 🛡 Security

All security docs now live in **[`../security/`](../security/README.md)** — the 16-point
implementation scorecard plus the detailed per-area blueprints (auth, API, database, secrets,
extension, cloud, DevSecOps, attack prevention, testing, etc.).

## 🔐 Admin & business

| Doc | Topic |
|-----|-------|
| [../admin/plan.md](../admin/plan.md) | Owner-only admin console — access control, users/logins, payments (refund/cancel), audit, feature flags. |
| [../admin/readme.md](../admin/readme.md) | Admin module overview. |
| [business_model.md](business_model.md) | Business & monetization model (market, user scenarios, freemium + B2B revenue). |

## ⚙️ Operations

| Doc | Topic |
|-----|-------|
| [MONITORING.md](MONITORING.md) | Metrics, logging, security alerts. |
| [SCALABILITY.md](SCALABILITY.md) | Stateless scaling, caching, replicas. |
| [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) | Backups, PITR, RTO/RPO, failover. |
| [COMPLIANCE.md](COMPLIANCE.md) | GDPR-ready, deletion, retention. |

---

<div align="center">

Keep this index in sync — when you add a doc here, add its row above **in the same commit**.

</div>
