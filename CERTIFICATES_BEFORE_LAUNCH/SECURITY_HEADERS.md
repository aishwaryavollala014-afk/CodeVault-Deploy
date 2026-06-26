# 🧱 Security Headers

> HTTP response headers that harden CodeVault's browser surface (XSS, clickjacking, sniffing). Partially implemented via Helmet; CSP needs tuning.

| Field | Detail |
|-------|--------|
| **Overview** | The set of security headers (CSP, HSTS, X-Frame-Options, etc.) returned by the frontend + APIs. |
| **Purpose** | Mitigate XSS, clickjacking, MIME sniffing, referrer leakage. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | Defense-in-depth for a credential-handling app; trivially cheap to set. |
| **Legally required?** | No. |
| **Technically required?** | Strongly recommended; some (HSTS) effectively required. |
| **When to implement** | Before launch. |
| **Priority** | 🟠 High |
| **Estimated Cost** | $0. |
| **Renewal** | Review on frontend changes (CSP). |
| **Official Website** | https://securityheaders.com · https://owasp.org/www-project-secure-headers/ |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Backends: Helmet sets sane defaults (already in `app.ts`).
2. Frontend: set headers in `next.config`/middleware + Cloudflare.
3. Build a strict **CSP** (script-src 'self' + nonces; connect-src = two API origins + GitHub/fonts; frame-ancestors 'none').
4. Validate at securityheaders.com (target A/A+).

## Required Documents
- None.

## Implementation Guide
- Headers: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, COOP/COEP/CORP, `Cache-Control: no-store` on authed responses.
- Remove `X-Powered-By` (already disabled in both services).

## Best Practices
- CSP with nonces, no `unsafe-inline`/`eval`; tighten `connect-src`.
- `no-store` on authenticated pages/responses.

## Common Mistakes
- CSP so loose it does nothing (`*`/`unsafe-inline`).
- Forgetting headers on API responses (only setting on FE).

## CodeVault-specific Notes
- Already: `helmet()` + `x-powered-by` disabled on `web-backend` + `git-service`.
- CSP `connect-src` must include both API origins so the FE can call them.

## Future Considerations
- CSP report-only → enforce rollout; CSP violation reporting endpoint.

## Checklist
- [ ] Helmet on both backends
- [ ] CSP (nonces, no inline/eval), frame-ancestors none
- [ ] HSTS, nosniff, Referrer-Policy, Permissions-Policy
- [ ] `no-store` on authed responses
- [ ] securityheaders.com A/A+

## References
- [HTTPS_CONFIGURATION.md](HTTPS_CONFIGURATION.md) · [../docs/BACKEND_SECURITY.md](../docs/BACKEND_SECURITY.md) · [../docs/SECURITY_PLAN.md](../docs/SECURITY_PLAN.md) §11
- OWASP Secure Headers Project
