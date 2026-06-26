# 🔐 HTTPS Configuration

> Enforce HTTPS everywhere with HSTS so CodeVault is never reachable over plaintext.

| Field | Detail |
|-------|--------|
| **Overview** | Redirect HTTP→HTTPS, enable HSTS (preload), and ensure all assets/APIs load over TLS. |
| **Purpose** | Eliminate downgrade/SSL-strip attacks; satisfy secure-cookie requirements. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | CodeVault's auth cookies are `Secure`; mixed content + plaintext break the security model. |
| **Legally required?** | Indirectly (data-protection "security of processing"). |
| **Technically required?** | **Yes.** |
| **When to implement** | With TLS, before launch. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | $0. |
| **Renewal** | N/A (HSTS max-age refreshed automatically). |
| **Official Website** | https://hstspreload.org |
| **Eligibility** | Valid TLS cert in place. |

## Step-by-Step Process
1. Force HTTP→HTTPS redirect (Cloudflare "Always Use HTTPS").
2. Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
3. Submit the domain to the **HSTS preload list** (after verifying all subdomains are HTTPS).
4. Fix any mixed-content; restrict `connect-src` in CSP to the two API origins + GitHub/fonts.

## Required Documents
- None.

## Implementation Guide
- Vercel + Cloudflare enforce HTTPS at the edge; set HSTS via Cloudflare or `next.config`/headers.
- Backend: helmet's HSTS is fine, but the authoritative HSTS is set at the edge.

## Best Practices
- `includeSubDomains` + `preload` only once **every** subdomain is HTTPS.
- Long `max-age` (1 year); never serve any subdomain over HTTP after preload.

## Common Mistakes
- Preloading before subdomains are HTTPS (locks you out of HTTP for a year).
- Mixed content (HTTP images/scripts) breaking the padlock.

## CodeVault-specific Notes
- `.app`/`.dev` TLDs are preloaded by default — HTTPS is mandatory regardless.
- Auth flow depends on `Secure` cookies → HTTPS is a hard prerequisite.

## Future Considerations
- HTTP/3 (QUIC) via Cloudflare for performance.
- Certificate Transparency monitoring.

## Checklist
- [ ] HTTP→HTTPS redirect on
- [ ] HSTS header (1yr, includeSubDomains, preload)
- [ ] No mixed content
- [ ] Submitted to HSTS preload (after subdomain audit)
- [ ] CSP connect-src restricted

## References
- [SSL_TLS_CERTIFICATE.md](SSL_TLS_CERTIFICATE.md) · [SECURITY_HEADERS.md](SECURITY_HEADERS.md) · [../docs/CLOUD_SECURITY.md](../docs/CLOUD_SECURITY.md)
- hstspreload.org · MDN: Strict-Transport-Security
