# 🧭 DNS Configuration

> Correct, secure DNS records route CodeVault's traffic and underpin TLS, email auth, and edge protection (Cloudflare).

| Field | Detail |
|-------|--------|
| **Overview** | The DNS records (A/AAAA/CNAME/MX/TXT/CAA) that map CodeVault's domain to Vercel, the backend LBs, and email/security infrastructure. |
| **Purpose** | Resolve the app/API/email + enable Cloudflare proxy, DNSSEC, and SPF/DKIM/DMARC. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | Nothing resolves without DNS; SPF/DKIM/DMARC, `_dmarc`, CAA, and ACME validation are all DNS records. |
| **Legally required?** | No. |
| **Technically required?** | **Yes.** |
| **When to implement** | Right after domain registration. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | **$0** (Cloudflare free DNS). |
| **Renewal** | N/A; review on infra changes. |
| **Official Website** | https://www.cloudflare.com/dns/ |
| **Eligibility** | Domain ownership. |

## Step-by-Step Process
1. Delegate the domain's nameservers to Cloudflare.
2. Add records: `A/AAAA` or `CNAME` for app/api (proxied 🟠), `MX` + email TXT (SPF/DKIM/DMARC), `CAA`, `_dmarc`.
3. Enable **DNSSEC** + **CAA** (restrict which CAs may issue certs).
4. Verify propagation; set sensible TTLs.

## Required Documents
- None.

## Implementation Guide
- `app` / `@` → Vercel (CNAME/A as Vercel instructs), proxied through Cloudflare.
- `api` / `sync` → backend LB hostnames, proxied (hide origin IP).
- `MX` → email provider; TXT for SPF/DKIM; `_dmarc` TXT for DMARC.
- `CAA` → allow only Let's Encrypt + Cloudflare/Google as issuers.

## Best Practices
- Proxy public records through Cloudflare (WAF/DDoS + hidden origin).
- DNSSEC on; CAA on; low TTL during migrations, raise when stable.
- Keep an internal record of every record + its purpose.

## Common Mistakes
- Exposing origin IPs (unproxied records → DDoS bypass).
- Missing CAA → any CA can mint certs for the domain.
- Wrong/duplicate SPF records (only one SPF TXT allowed).

## CodeVault-specific Notes
- Hide both backend origins behind Cloudflare; only the LB is reachable, and only from Cloudflare (AOP).
- Add `security.txt` location + status-page CNAME early.

## Future Considerations
- Geo/latency routing as global traffic grows.
- Separate zones per environment (staging/prod).

## Checklist
- [ ] Nameservers on Cloudflare
- [ ] App/API records proxied; origin IPs hidden
- [ ] DNSSEC + CAA enabled
- [ ] SPF/DKIM/DMARC TXT records present and valid
- [ ] Sensible TTLs; records documented

## References
- [DOMAIN_REGISTRATION.md](DOMAIN_REGISTRATION.md) · [SPF.md](SPF.md) · [DKIM.md](DKIM.md) · [DMARC.md](DMARC.md) · [../docs/CLOUD_SECURITY.md](../docs/CLOUD_SECURITY.md)
- Cloudflare DNS / DNSSEC docs · RFC 8659 (CAA)
