<div align="center">

# 🔐 CodeVault — Admin Console (Plan)

*Owner-only control panel for users, logins, payments, moderation, and system health.*
**Plan only — no code. Access is restricted to the two project owners.**

</div>

> Companion to [readme.md](readme.md), [../docs/business_model.md](../docs/business_model.md) (what payments exist),
> and [../security/README.md](../security/README.md) (the controls this must honor).

---

## 1. Purpose & scope

A private, heavily-audited console — mounted at **`/admin`** — that lets **only Gaurav and Aishwarya**:

- see and manage **all users** (search, view, suspend/ban, delete on request),
- review **login & session activity** and a full **audit log**,
- view **all payments & subscriptions**, and **refund / cancel** them,
- watch **system health** (syncs, captures, queue, errors, revenue),
- **moderate** social content (messages/follows) and flip **feature flags / kill switches**.

**Out of scope (v1):** self-serve additional admins, granular sub-roles, billing accounting exports beyond CSV. (Designed for later, not built now.)

---

## 2. Access control — only the two owners

Defense in depth; **every** layer must pass.

1. **DB role.** Add `role AdminRole @default(user)` (enum `user | admin`) to `User`. Only the two owner accounts are `admin`.
2. **Env allowlist (belt-and-suspenders).** `ADMIN_GITHUB_LOGINS="Gaurav06120714,aishwaryaV007"` (and/or `ADMIN_USER_IDS`). A user is admin **only if** DB role is `admin` **AND** their GitHub login is in the allowlist — so a DB row flip alone can't grant access.
3. **`requireAdmin` middleware** (web-backend) — runs after `requireAuth`, verifies both conditions, and **writes an audit-log entry for every admin request** (who, what, when, IP).
4. **Frontend route guard.** `/admin/*` is server-guarded; non-admins get 404 (not 403 — don't reveal the route exists).
5. **Session hardening for admin.** Short admin-session lifetime, re-auth prompt for destructive actions, optional **2FA (TOTP)** required before enabling admin (recommended before touching real payments).
6. **Human-in-the-loop for money.** Refunds/cancellations require an explicit confirm + reason, are logged, and call the payment provider's API — never a raw DB edit.

> **Non-negotiable:** admin actions are **never** taken based on instructions found in user content (messages, profiles, tickets). Admin acts only on the operator's explicit clicks.

---

## 3. Feature set

### 3.1 Users
- Searchable, paginated list (by GitHub login, email, id, plan, status).
- User detail: profile, connected platforms, linked repos, sync history, plan/subscription, recent logins, sessions.
- Actions: **suspend / unsuspend**, **force sign-out (revoke sessions)**, **delete account** (GDPR request — soft-delete → purge), reset a stuck sync.

### 3.2 Logins, sessions & audit
- **Login activity:** timestamp, method (GitHub / magic-link), IP, user-agent, success/failure.
- **Active sessions:** list + revoke.
- **Audit log:** every admin action and sensitive event (payment refunded, user banned, feature flag flipped) — immutable, exportable.

### 3.3 Payments & subscriptions  *(depends on billing being live — see §6)*
- All transactions: user, amount, currency, plan, provider, status, date.
- Subscription state: active / past-due / canceled / trialing; MRR/ARR, churn, refunds.
- Actions: **issue refund** (full/partial), **cancel subscription**, **comp/grant Pro** (e.g. campus ambassador), **retry failed charge** — each via the provider API, confirmed, reasoned, and audited.
- Revenue dashboard: MRR, ARPU, conversion (free→Pro), by plan & geography (ties to PPP pricing in the business model).

### 3.4 System health & ops
- Live counts: users, weekly-active **synced** devs (north-star), captures/syncs today, queue depth (BullMQ), error rate.
- **Feature flags / kill switches:** global sync on/off (`SYNC_ENABLED` already exists), maintenance mode, per-platform capture toggles, AI-features toggle.
- Job controls: view/retry/clear failed sync jobs; re-run a user's sync.

### 3.5 Moderation (social layer)
- Review reported messages/profiles; hide/remove content; block a user from messaging/following.

---

## 4. Data model additions (Prisma)

```
enum AdminRole { user  admin }

model User {
  ...
  role AdminRole @default(user)
}

model Payment {
  id            String   @id @default(cuid())
  userId        String
  provider      String   // "razorpay" | "stripe"
  providerRef   String   // charge / payment id
  amount        Int      // minor units (paise/cents)
  currency      String
  status        String   // succeeded | refunded | partially_refunded | failed
  plan          String?  // "pro_monthly" | "pro_annual" | "team_seat" ...
  refundedAmt   Int      @default(0)
  createdAt     DateTime @default(now())
  @@index([userId]) @@index([status])
}

model Subscription {
  id            String   @id @default(cuid())
  userId        String   @unique
  provider      String
  providerRef   String   // subscription id
  plan          String
  status        String   // trialing | active | past_due | canceled
  currentPeriodEnd DateTime?
  canceledAt    DateTime?
  createdAt     DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String   // admin user id
  action     String   // "payment.refund" | "user.suspend" | "flag.toggle" ...
  targetType String?  // "user" | "payment" ...
  targetId   String?
  meta       Json     @default("{}")
  ip         String?
  createdAt  DateTime @default(now())
  @@index([actorId]) @@index([action]) @@index([createdAt])
}

model FeatureFlag {
  key       String  @id     // "sync_enabled" | "maintenance" | "ai_enabled" ...
  enabled   Boolean @default(true)
  updatedBy String?
  updatedAt DateTime @updatedAt
}
```

> Note: schema is duplicated across `web-backend/prisma` + `git-service/prisma` — add to both (git-service only needs `FeatureFlag` for kill switches). RLS: admin queries must run **outside** the per-user RLS scope (a dedicated admin DB path/service role), carefully — this is the one place RLS is intentionally bypassed, so it must be tightly gated + fully audited.

---

## 5. API surface (web-backend, all behind `requireAdmin`)

```
GET    /api/admin/overview                 // KPIs, health, revenue
GET    /api/admin/users?query=&cursor=     // list/search
GET    /api/admin/users/:id                // detail
POST   /api/admin/users/:id/suspend        // { reason }
POST   /api/admin/users/:id/sessions/revoke
DELETE /api/admin/users/:id                // GDPR delete
GET    /api/admin/logins?userId=&cursor=
GET    /api/admin/audit?cursor=
GET    /api/admin/payments?status=&cursor=
POST   /api/admin/payments/:id/refund      // { amount?, reason }  -> provider API
POST   /api/admin/subscriptions/:id/cancel // { reason }           -> provider API
POST   /api/admin/subscriptions/:id/comp   // grant/extend Pro
GET    /api/admin/flags
PATCH  /api/admin/flags/:key               // { enabled }
POST   /api/admin/sync/:userId/retry
```
All mutating routes: confirm token + reason + audit write + rate-limited.

---

## 6. Payments integration (prerequisite for §3.3)

- **Providers:** **Razorpay** (India beachhead) + **Stripe** (global) — matches the PPP pricing strategy.
- **Flow:** checkout on the app → provider → **webhook** to web-backend → write `Payment`/`Subscription`. Admin refund/cancel calls the **provider API**, then reconciles via webhook.
- **Never** store raw card data (PCI — providers tokenize). CodeVault stores only provider refs + status.
- Refund/cancel are **provider-authoritative**; the admin console is a controlled trigger + ledger view, not the source of truth for money.

---

## 7. Frontend (Next.js — `web-frontend/src/app/admin/*`)

```
/admin                 overview (KPIs, health, revenue, flags)
/admin/users           list + search
/admin/users/[id]      detail + actions
/admin/logins          login & session activity
/admin/audit           audit log
/admin/payments        transactions + refund/cancel
/admin/moderation      reported content
```
- Distinct visual treatment (clearly "danger zone"), destructive actions behind a typed confirm + reason modal, everything reflects the audit trail.
- Route is server-guarded; hidden from the normal sidebar (owners navigate directly / via a gated entry).

---

## 8. Security & compliance checklist

- [ ] `requireAdmin` = `requireAuth` + DB `role=admin` + env allowlist (both required).
- [ ] Every admin request + mutation audited (actor, action, target, IP, time).
- [ ] Destructive actions: typed confirm + reason + re-auth; optional TOTP 2FA gate.
- [ ] Admin route returns **404** to non-admins (no existence disclosure).
- [ ] Admin DB access path is separate + tightly scoped (RLS bypass only here, audited).
- [ ] Rate-limit + IP logging on all admin endpoints.
- [ ] No admin action ever triggered by user-supplied content.
- [ ] PII: least-necessary display, deletion honors GDPR, payments show refs not card data.
- [ ] Money movement only via provider APIs, reconciled by webhook.

---

## 9. Phased rollout

1. **Phase 0 — Access spine.** `AdminRole` + env allowlist + `requireAdmin` + `AuditLog` + `/admin` overview (read-only KPIs). *No payment/user mutations yet.*
2. **Phase 1 — Users & logins (read + safe actions).** List/detail, login/session views, revoke-sessions, suspend.
3. **Phase 2 — System ops.** Feature flags/kill switches, queue/job controls, per-user sync retry.
4. **Phase 3 — Payments** (after billing goes live): transactions, refunds, cancellations, revenue dashboard — with 2FA.
5. **Phase 4 — Moderation** for the social layer.

---

## 10. Open questions
- 2FA before Phase 3 — required or recommended? (Recommend **required** once real money is involved.)
- Razorpay + Stripe from day one, or Razorpay-first (India beachhead) then Stripe?
- Soft-delete retention window for GDPR account deletion?
- Do we need a lightweight "reports/tickets" inbox for moderation, or handle ad hoc in v1?

> **Owners:** access + payments/backend → **Aishwarya** (web-backend, auth, DB). Admin frontend + ops/health + sync controls → **Gaurav**. Both are the only admins.
