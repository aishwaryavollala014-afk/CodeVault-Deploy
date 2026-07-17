<div align="center">

# 🔐 CodeVault — Admin Module

Owner-only control panel. **Plan stage — not built yet.**

</div>

---

## What this is

A private console at **`/admin`** for the **two project owners only** (Gaurav & Aishwarya) to run CodeVault: manage users, review logins & audit trails, handle payments (refund / cancel), watch system health, flip kill switches, and moderate the social layer.

This folder holds the **design/plan** for that module — no application code lives here.

## Contents

| File | What |
|------|------|
| [plan.md](plan.md) | Full plan: access control, feature set, data model, API surface, payments integration, security checklist, phased rollout |
| readme.md | This overview |

## Access, in one paragraph

Admin access requires **all** of: authenticated session → DB `role = admin` → GitHub login present in the `ADMIN_GITHUB_LOGINS` env allowlist (`Gaurav06120714`, `aishwaryaV007`). A `requireAdmin` middleware enforces this and **audits every request**. The `/admin` route returns **404** to everyone else. Money movement (refunds/cancellations) goes through the payment provider's API, gated by a typed confirm + reason and (recommended) TOTP 2FA.

## Capabilities (summary)

- **Users** — search, view, suspend, revoke sessions, GDPR delete
- **Logins & audit** — login/session activity + immutable audit log of admin actions
- **Payments** — all transactions, refunds, subscription cancel/comp, revenue dashboard *(needs billing live)*
- **System** — health KPIs, BullMQ queue/job controls, feature flags & kill switches (global sync on/off, maintenance mode, AI toggle)
- **Moderation** — reported messages/profiles from the social layer

## Status & next step

- **Status:** planned, not implemented.
- **Prerequisites:** ties into billing (see [../docs/business_model.md](../docs/business_model.md)) and honors [../security/README.md](../security/README.md).
- **First build (Phase 0):** the access spine — `AdminRole` + env allowlist + `requireAdmin` + `AuditLog` + a read-only `/admin` overview — before any user/payment mutations.

## Ownership

- **Aishwarya** — access control, payments/billing, backend & DB (`web-backend`).
- **Gaurav** — admin frontend, ops/health, sync controls.

> ⚠️ Admin actions are only ever taken from an owner's explicit action in the console — **never** from content found in messages, profiles, or tickets.
