# 🚀 How to Run CodeVault (Local Development)

> Step-by-step guide to run the complete CodeVault project on your local machine.

---

## Prerequisites

| Tool       | Version  | Check command          |
|------------|----------|------------------------|
| Node.js    | ≥ 18.18  | `node -v`              |
| npm        | ≥ 9      | `npm -v`               |
| Docker     | ≥ 24     | `docker --version`     |
| Docker Compose | ≥ 2  | `docker compose version` |

---

## Quick Start (TL;DR)

Open **4 terminals** in the `CodeVault/` root and run these in order:

```bash
# Terminal 1 — Start PostgreSQL + Redis (data layer)
docker compose up -d postgres redis

# Terminal 2 — Start web-backend (port 4000)
cd web-backend
npm run dev

# Terminal 3 — Start git-service (port 5050)
cd git-service
npm run dev

# Terminal 4 — Start web-frontend (port 3000)
cd web-frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Detailed Steps

### Step 1: Start the Data Layer (PostgreSQL + Redis)

The project uses **PostgreSQL 16** (database) and **Redis 7** (caching + queues), both running via Docker.

```bash
# From the CodeVault root directory
docker compose up -d postgres redis
```

**Verify they're running:**
```bash
docker compose ps
```

You should see `codevault-postgres` (healthy) and `codevault-redis` (healthy).

| Service    | Container Name     | Host Port | Internal Port |
|------------|--------------------|-----------|---------------|
| PostgreSQL | codevault-postgres | **5433**  | 5432          |
| Redis      | codevault-redis    | **6380**  | 6379          |

> **Note:** Ports are non-standard (5433/6380) to avoid conflicts with any local PostgreSQL/Redis.

---

### Step 2: Install Dependencies (first time only)

If `node_modules` doesn't exist in any service, install:

```bash
# From CodeVault root
cd web-backend  && npm install && cd ..
cd git-service  && npm install && cd ..
cd web-frontend && npm install && cd ..
```

---

### Step 3: Set Up Environment Files (first time only)

Each service needs a `.env` file. Copy from examples if they don't exist:

```bash
# web-backend
cp web-backend/.env.example web-backend/.env

# git-service
cp git-service/.env.example git-service/.env
```

The frontend uses `.env.local` (already present).

**Key values already configured:**

| Variable        | web-backend          | git-service          | web-frontend (.env.local) |
|-----------------|----------------------|----------------------|---------------------------|
| PORT            | 4000                 | 5050                 | 3000 (Next.js default)    |
| DATABASE_URL    | `...localhost:5433/codevault` | `...localhost:5433/codevault` | N/A              |
| REDIS_URL       | `redis://localhost:6380`      | `redis://localhost:6380`      | N/A              |
| API_URL         | N/A                  | N/A                  | `http://localhost:4000/api` |
| GIT_SERVICE_URL | N/A                  | N/A                  | `http://localhost:5050/api` |

> ⚠️ **IMPORTANT:** `JWT_SECRET` and `ENCRYPTION_KEY` must match in both `web-backend/.env` and `git-service/.env`.

---

### Step 4: Run Database Migrations (first time / after schema changes)

```bash
cd web-backend
npx prisma migrate dev
npx prisma generate
```

---

### Step 5: Start web-backend (Terminal 2)

```bash
cd web-backend
npm run dev
```

Runs on **http://localhost:4000** with hot-reload via nodemon + tsx.

**What it does:** Auth (GitHub OAuth), platform connections, multi-platform stats aggregation, public profiles.

---

### Step 6: Start git-service (Terminal 3)

```bash
cd git-service
npm run dev
```

Runs on **http://localhost:5050** with hot-reload via nodemon + tsx.

**What it does:** Fetches accepted code, pushes to GitHub repos, runs scheduled syncs.

---

### Step 7: Start web-frontend (Terminal 4)

```bash
cd web-frontend
npm run dev
```

Runs on **http://localhost:3000** (Next.js dev server).

**What it does:** The website UI — landing, login, dashboard, connect, public profile, settings, etc.

---

## Service Ports Summary

| Service        | URL                          | Purpose                    |
|----------------|------------------------------|----------------------------|
| Web Frontend   | http://localhost:3000         | Website UI                 |
| Web Backend    | http://localhost:4000/api     | Auth, stats, profiles API  |
| Git Service    | http://localhost:5050/api     | Code sync, GitHub push API |
| PostgreSQL     | localhost:5433                | Database                   |
| Redis          | localhost:6380                | Cache + Queues             |

---

## Stopping Everything

```bash
# Stop the frontend/backend/git-service: Ctrl+C in each terminal

# Stop the data layer (keeps data):
docker compose stop

# Stop AND delete data (full reset):
docker compose down -v
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on port 5433 | Docker not running → start Docker Desktop, then `docker compose up -d postgres redis` |
| `ECONNREFUSED` on port 6380 | Same as above — Redis container not running |
| Prisma errors | Run `cd web-backend && npx prisma migrate dev && npx prisma generate` |
| Port already in use | Change the port in the service's `.env` file |
| `node_modules` missing | Run `npm install` in that service's folder |
| JWT/auth errors between services | Make sure `JWT_SECRET` and `ENCRYPTION_KEY` match in both `.env` files |

---

## Full Docker Mode (Alternative)

To run **everything** (including backends) in Docker:

```bash
docker compose up -d
```

This builds and runs all 4 services. Use this for production-like testing, but `npm run dev` is faster for development.
