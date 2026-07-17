<div align="center">

# 🔐 CodeVault — Admin (standalone app)

Owner-only control panel. **Its own Next.js app** — UI **and** API — on port **3100**.

</div>

---

## What this is

A self-contained admin console: Next.js **pages** (UI) + **route handlers** (API) + its own
**Prisma** client, all under `admin/`. It talks to the **same Postgres** as the rest of CodeVault
and reuses the **same session cookie** (`cv_access`) — cookies are host-scoped, so a login on
`localhost:3000` is valid here on `localhost:3100`.

Access requires **all** of: a valid `cv_access` session → DB `role = admin` → GitHub login in
`ADMIN_GITHUB_LOGINS`. Every API route **fails closed with 404** for anyone else.

## Layout

```
admin/
├── plan.md, readme.md          docs
├── package.json, tsconfig.json, next.config.ts, .env.example
├── prisma/schema.prisma        own Prisma client (owner conn → RLS-bypass)
└── src/
    ├── lib/prisma.ts           owner Prisma client
    ├── lib/auth.ts             getAdmin() — cookie JWT verify + role/allowlist guard
    └── app/
        ├── layout.tsx          shell
        ├── page.tsx            Overview (UI)
        ├── users/page.tsx      Users (UI)
        └── api/
            ├── overview/route.ts   backend: KPIs
            └── users/route.ts      backend: user list
```

## Run it

```bash
cd admin
npm install
cp .env.example .env      # set JWT_SECRET to MATCH web-backend; ADMIN_GITHUB_LOGINS as needed
npx prisma generate
npm run dev               # http://localhost:3100
```

Prereqs: Postgres running (the shared CodeVault DB), and an owner account whose `role = 'admin'`:
```sql
UPDATE users SET role='admin' WHERE "githubLogin" IN ('gaurav06120714','aishwaryav007');
```
Then sign in on the main app (`localhost:3000`) and open **http://localhost:3100**.

## Status

- **Working:** access guard (fail-closed 404), Overview KPIs, Users list/search, request auditing.
- **Next (per [plan.md](plan.md)):** user detail/actions, logins, audit view, payments (refund/cancel), feature flags.

> ⚠️ Admin actions are only ever taken from an owner's explicit action here — never from content found in messages, profiles, or tickets. Money movement goes through the payment provider's API.
