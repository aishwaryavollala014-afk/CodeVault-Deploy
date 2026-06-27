# 🧑‍💻 CodeVault — Secure Development, Local Setup & Deployment

> The developer-facing secure-workflow guide for CodeVault: how to write/verify code (including AI-generated code), run the project locally, and deploy safely. This is the authoritative home for **Development & AI Security Practices**, **Local Development**, and **Deployment Security**. For the architecture-level controls it references, see [SECURITY_PLAN](SECURITY_PLAN.md), [BACKEND_SECURITY](BACKEND_SECURITY.md), [AUTH_SECURITY](AUTH_SECURITY.md), [API_SECURITY](API_SECURITY.md), [DATABASE_SECURITY](DATABASE_SECURITY.md), [SECRETS](SECRETS.md), and [DEVSECOPS](DEVSECOPS.md).

CodeVault architecture this guide applies to: **Next.js frontend · Express web-backend · Express git-service · Prisma · GitHub OAuth**, with a separate frontend/backend split, a public stats service, and an authorized GitHub synchronization service.

---

## 1. Development & AI Security Practices

CodeVault is built with AI assistance. Treat AI output as a draft, never as trusted code.

- **AI-generated code must always be reviewed.** Every AI-produced change is read and understood before it is committed.
- **Security prompts never replace manual verification.** Asking the model to "make it secure" is not evidence the code is secure.
- **Verify the implementation after every AI-generated security change.** Confirm the change actually does what was intended (e.g. run the endpoint, check the response, inspect the data path).
- **Think through every request: frontend → backend → database.** For each feature, trace the full path (Next.js → web-backend/git-service → Prisma) and confirm validation, authentication, and authorization happen on the backend.
- **Verify authorization before every action.** Each protected operation must confirm the caller is permitted before performing it (see [AUTH_SECURITY](AUTH_SECURITY.md), [API_SECURITY](API_SECURITY.md)).
- **Keep secrets inside `.env`.** Configuration and credentials live in environment files, never in source.
- **Never commit secrets.** `.env` files are gitignored; only `.env.example` (placeholders) is committed (see [SECRETS](SECRETS.md)).
- **Use GitHub for version control.** All work is tracked in the GitHub repository.
- **Keep dependencies updated.** Apply package and security updates regularly (see [DEVSECOPS](DEVSECOPS.md)).
- **Remove debug code before production.** Strip debug logs and temporary console output before shipping (see [BACKEND_SECURITY](BACKEND_SECURITY.md) error handling).

> Rule of thumb: an AI security change is "done" only after a human has read it, traced the request path, and verified authorization + behavior.

---

## 2. Local Development

How to run CodeVault locally and keep local work secure.

**Prerequisites**
- Install **Node.js** (per each service's required version).
- Each part of the monorepo is run independently: `web-frontend`, `web-backend`, `git-service`.

**Run a service**
```bash
cd <service>            # web-frontend | web-backend | git-service
npm install             # install dependencies
cp .env.example .env    # create local env from the template, then fill values
npm run dev             # start the service in development
```

**Environment variables**
- Copy `.env.example` → `.env` in each service and provide local values.
- `.env` is gitignored — **never commit it**. Keep all secrets (GitHub OAuth, JWT/encryption keys, DB/Redis URLs) inside `.env`.

**Local Git / GitHub workflow**
- Use Git for all changes and push to the GitHub repository (version control).
- Do not commit secrets or generated artifacts; rely on `.gitignore`.

**Local testing before deployment**
- Run and exercise the affected services locally before deploying.
- Trace the change end-to-end (frontend → backend → database) and verify authorization and expected behavior locally first.

> See each service's `README.md` "Getting started" for service-specific commands; this section is the security-focused summary.

---

## 3. Deployment Security

A focused deployment checklist. For infrastructure and pipeline detail, see [INFRASTRUCTURE_SECURITY](INFRASTRUCTURE_SECURITY.md), [DEVOPS_PLAN](DEVOPS_PLAN.md), and [DEVSECOPS](DEVSECOPS.md); for header/TLS specifics see [SECURITY_PLAN §11](SECURITY_PLAN.md).

- **Deploy using HTTPS.** Production is served over HTTPS; HTTP is not accepted (see HTTPS in [SECURITY_PLAN §6/§11](SECURITY_PLAN.md)).
- **Store environment variables securely.** Production secrets are provided through the platform's secure environment configuration, not committed to source (see [SECRETS](SECRETS.md)).
- **Never expose secrets.** No secret (GitHub OAuth secret, JWT/encryption keys, DB/Redis credentials) appears in client code, logs, or the repository.
- **Verify production configuration.** Confirm the production environment is configured correctly before and after deploy (env present and valid, HTTPS enforced, debug code removed).

### Production deployment checklist
- [ ] Served over **HTTPS** (HTTP redirected/blocked)
- [ ] All required **environment variables** set securely in the platform (not committed)
- [ ] **No secrets** in client code, logs, or the repo
- [ ] **Debug code / debug logs removed** (no stack traces or internal info leaked)
- [ ] **Dependencies updated** (security updates applied)
- [ ] **Authorization verified** on every protected route/endpoint
- [ ] Production configuration **verified** (and AI-generated changes manually reviewed)

---

## 4. Topic ownership (where each practice is enforced)

| Practice | Authoritative document |
|----------|------------------------|
| AI code review · local dev · deployment checklist | **this document** |
| HTTPS · CSRF · sensitive data in browser · input validation/XSS | [SECURITY_PLAN §6](SECURITY_PLAN.md), [BACKEND_SECURITY](BACKEND_SECURITY.md) |
| API keys / secrets / env vars | [SECRETS](SECRETS.md) |
| Authentication · authorization · secure cookies | [AUTH_SECURITY](AUTH_SECURITY.md) |
| API protection · CORS · rate limiting | [API_SECURITY](API_SECURITY.md), [BACKEND_SECURITY](BACKEND_SECURITY.md) |
| SQL injection / Prisma / parameterized queries | [DATABASE_SECURITY](DATABASE_SECURITY.md) |
| Security headers (X-Frame-Options, X-Content-Type-Options) | [SECURITY_PLAN §11](SECURITY_PLAN.md) |
| DDoS / cloud protection | [CLOUD_SECURITY](CLOUD_SECURITY.md) |
| Dependency management | [DEVSECOPS](DEVSECOPS.md) |
| Error handling | [BACKEND_SECURITY](BACKEND_SECURITY.md) |
| File upload | [FILE_UPLOAD_SECURITY](FILE_UPLOAD_SECURITY.md) |

---

## 5. References
- [SECURITY_PLAN.md](SECURITY_PLAN.md) · [BACKEND_SECURITY.md](BACKEND_SECURITY.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md) · [API_SECURITY.md](API_SECURITY.md) · [DATABASE_SECURITY.md](DATABASE_SECURITY.md) · [SECRETS.md](SECRETS.md) · [DEVSECOPS.md](DEVSECOPS.md) · [INFRASTRUCTURE_SECURITY.md](INFRASTRUCTURE_SECURITY.md) · [CLOUD_SECURITY.md](CLOUD_SECURITY.md) · [FILE_UPLOAD_SECURITY.md](FILE_UPLOAD_SECURITY.md)
- Service setup: [../web-frontend/README.md](../web-frontend/README.md) · [../web-backend/README.md](../web-backend/README.md) · [../git-service/README.md](../git-service/README.md)
