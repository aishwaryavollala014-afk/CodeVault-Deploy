# 🌐 Domain Registration

> CodeVault needs a registered domain (e.g. `codevault.app`) before it can have TLS, email auth, or a public OAuth callback.

| Field | Detail |
|-------|--------|
| **Overview** | Registering a domain name through an ICANN-accredited registrar, then managing its DNS. |
| **Purpose** | A stable, branded address for the app, API, and email. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | OAuth callback URLs, TLS certs, SPF/DKIM/DMARC, and `security.txt` all depend on owning a domain. |
| **Legally required?** | No — but trademark/brand considerations apply (see [TRADEMARK](TRADEMARK.md)). |
| **Technically required?** | **Yes** — everything public hangs off the domain. |
| **When to implement** | First — before DNS, TLS, OAuth, and email. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | **$10–$40/yr** (.com/.app/.dev); premium names more. |
| **Renewal** | Annual; enable **auto-renew** + registrar lock. |
| **Official Website** | https://www.cloudflare.com/products/registrar/ · https://domains.google (Squarespace) · https://www.namecheap.com |
| **Eligibility** | Anyone; some TLDs (.app/.dev) force HTTPS (HSTS preload). |

## Step-by-Step Process
1. Choose a name; check availability + trademark conflicts.
2. Register via a reputable registrar (Cloudflare Registrar = at-cost, no markup).
3. Enable **registrar lock**, **auto-renew**, and **WHOIS privacy**.
4. Delegate DNS to Cloudflare (see [DNS_CONFIGURATION](DNS_CONFIGURATION.md)).

## Required Documents
- Valid contact + payment details. No formal documents for standard TLDs.

## Implementation Guide
- Prefer `.app`/`.dev` (HSTS-preloaded → HTTPS enforced by browsers) or `.com` for familiarity.
- Reserve matching social/GitHub-org handles for brand consistency.

## Best Practices
- Auto-renew + lock to prevent expiry/hijack; WHOIS privacy to reduce spam/phishing.
- Use a role mailbox (e.g. `admin@`) not a personal email as registrant contact.

## Common Mistakes
- Letting the domain lapse (catastrophic — breaks TLS/OAuth/email).
- Personal email as owner; losing access on team changes.
- No registrar lock → domain hijack risk.

## CodeVault-specific Notes
- The OAuth callback `https://<domain>/api/v1/auth/github/callback` must be registered in the GitHub OAuth App (see [GITHUB_OAUTH_REQUIREMENTS](GITHUB_OAUTH_REQUIREMENTS.md)).
- Plan subdomains: `app.`/`api.`/`sync.`/`status.` early.

## Future Considerations
- Defensive registrations (common typos, other TLDs) as the brand grows.
- ccTLDs for regional presence when scaling globally.

## Checklist
- [ ] Domain registered at a reputable registrar
- [ ] Auto-renew + registrar lock + WHOIS privacy on
- [ ] DNS delegated to Cloudflare
- [ ] Subdomain plan defined
- [ ] Role-based registrant contact

## References
- [DNS_CONFIGURATION.md](DNS_CONFIGURATION.md) · [TRADEMARK.md](TRADEMARK.md) · [SSL_TLS_CERTIFICATE.md](SSL_TLS_CERTIFICATE.md)
- ICANN · Cloudflare Registrar docs
