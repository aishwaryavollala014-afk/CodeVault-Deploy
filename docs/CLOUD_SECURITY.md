# ☁️ CodeVault — Cloud & Edge Security

> Securing CodeVault's edge with **Cloudflare** (DNS, WAF, DDoS, bot protection) and the CDN/TLS layer fronting Vercel + the backend load balancers. Companion to [INFRASTRUCTURE_SECURITY](INFRASTRUCTURE_SECURITY.md) and [SCALABILITY](SCALABILITY.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Stop attacks at the edge before they reach origin: absorb DDoS, filter malicious requests (WAF), block bots/scrapers (especially on `/public/:username`), and enforce strong TLS — while caching static + public content for speed.

---

## 2. Architecture

```
Internet → Cloudflare (DNS + WAF + DDoS + Bot Mgmt + TLS + cache)
            ├─▶ Vercel (web-frontend: static/SSG/ISR cached at edge)
            ├─▶ web-backend LB (origin, allowlisted to Cloudflare IPs)
            └─▶ git-service LB (origin)
```

Origins accept traffic **only** from Cloudflare (IP allowlist / Authenticated Origin Pulls).

---

## 3. Best Practices

- **WAF** managed rulesets + custom rules (block known SQLi/XSS/SSRF patterns at the edge).
- **DDoS protection** (L3/L4 automatic; L7 rate rules on `/public`, `/auth`, `/sync`).
- **Bot management** on scraping-prone public profile endpoints.
- **DNSSEC + CAA** records; registrar lock.
- **TLS 1.2+/1.3**, **HTTP/3**, HSTS preload; full-strict origin certs.
- **Geo/IP reputation** rules where abuse warrants.

---

## 4. Threats

L3/L4/L7 DDoS · credential-stuffing floods on `/auth` · scraping/enumeration on `/public/:username` · cache poisoning · DNS hijack/spoofing · TLS downgrade/strip · origin exposure (bypassing Cloudflare).

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| DDoS L3/L4 | Cloudflare automatic mitigation |
| DDoS L7 | rate rules + challenge on suspicious traffic |
| Credential stuffing | rate-limit `/auth/*`; managed challenge |
| Scraping/enumeration | bot rules + per-IP limits + uniform 404 + cache |
| Cache poisoning | cache keys exclude auth; vary correctly; no caching of authed responses |
| DNS hijack | DNSSEC, registrar lock, CAA |
| TLS strip | HSTS preload, redirect HTTP→HTTPS, min TLS 1.2 |
| Origin exposure | Authenticated Origin Pulls / Cloudflare-IP allowlist on LBs |

---

## 6. Implementation Guidelines

- Cache **only** static assets + public profile HTML (ISR); **never** cache authenticated API responses (`Cache-Control: no-store` on auth pages).
- Restrict `connect-src` (CSP) to the two API origins + GitHub/fonts.
- Put L7 rate limits at the edge **in addition to** app-level Redis limits (defense in depth).
- Keep real origin hostnames private; only Cloudflare-proxied records are public.

---

## 7. Folder Structure (config-as-code)

```
infra/cloudflare/        # (future) Terraform: zones, WAF rules, rate limits, DNS
docs/CLOUD_SECURITY.md   # this guide
```

---

## 8. Recommended Tools

Cloudflare (WAF, DDoS, Bot Mgmt, Access), Vercel edge CDN, Terraform `cloudflare` provider, `cloudflared` for tunnels if origins stay fully private.

---

## 9. Configuration Examples

```
# Cloudflare (conceptual)
SSL/TLS: Full (strict), Min TLS 1.2, HTTP/3 on, HSTS max-age=31536000; preload
WAF: managed ruleset ON; custom rule: block path "/api/*" where bot_score < 30
Rate limit: /api/v1/auth/* → 20 req/min/IP → managed challenge
Rate limit: /api/v1/public/* → 60 req/min/IP
Authenticated Origin Pulls: ON (LB validates Cloudflare client cert)
```

---

## 10. Production Considerations

- Monitor WAF events, challenge rates, and origin error rates.
- Tune bot rules to avoid blocking legitimate shared public-profile traffic.
- Have a **"under attack" mode** runbook; coordinate with app kill switches.
- Cache purge on deploy for static assets.

---

## 11. Future Improvements

- Cloudflare Access (Zero Trust) for admin/internal tools.
- API Shield (schema validation + mTLS) in front of the APIs.
- Turnstile/CAPTCHA on contact + public profile abuse.

---

## 12. Checklist

- [ ] WAF managed + custom rules enabled
- [ ] L7 rate limits on `/auth`, `/public`, `/sync`
- [ ] Bot management on public profile
- [ ] DNSSEC + CAA + registrar lock
- [ ] TLS 1.2+/1.3, HTTP/3, HSTS preload, Full-strict
- [ ] Origins accept Cloudflare only (AOP/IP allowlist)
- [ ] Authed responses never cached
- [ ] WAF/challenge monitoring + under-attack runbook

---

## 13. References

- [INFRASTRUCTURE_SECURITY.md](INFRASTRUCTURE_SECURITY.md) · [SCALABILITY.md](SCALABILITY.md) · [ATTACK_PREVENTION.md](ATTACK_PREVENTION.md)
- Cloudflare WAF / DDoS / Bot Management docs · OWASP DDoS guidance


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [ ] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
