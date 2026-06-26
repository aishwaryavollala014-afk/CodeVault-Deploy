# 🚀 Launch Checklist

> The single go/no-go checklist that aggregates every mandatory item from this knowledge base. CodeVault is **go for launch** only when all ✅ items pass.

| Field | Detail |
|-------|--------|
| **Overview** | A consolidated pre-launch gate covering legal, security, infra, and product readiness. |
| **Purpose** | One place to confirm CodeVault is safe and compliant to deploy publicly. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | Prevents shipping with missing legal docs, weak security, or no backups. |
| **Legally required?** | No (the underlying items may be). |
| **Technically required?** | Process control. |
| **When to implement** | Maintained continuously; gate at each release. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | $0. |
| **Renewal** | Re-run every release. |
| **Official Website** | — |
| **Eligibility** | — |

## Step-by-Step Process
Work top-to-bottom; every box ticked = go.

## Legal & Trust (✅ Mandatory)
- [ ] [Privacy Policy](PRIVACY_POLICY.md) live + linked
- [ ] [Terms of Service](TERMS_OF_SERVICE.md) live + accepted at connect
- [ ] [Cookie Policy](COOKIE_POLICY.md) published
- [ ] [Open Source License](OPEN_SOURCE_LICENSE.md) decided + `LICENSE` present
- [ ] [Copyright](COPYRIGHT.md) notice in footer + LICENSE

## Domain, DNS, TLS (✅ Mandatory)
- [ ] [Domain](DOMAIN_REGISTRATION.md) registered, locked, auto-renew
- [ ] [DNS](DNS_CONFIGURATION.md): proxied, DNSSEC + CAA
- [ ] [SSL/TLS](SSL_TLS_CERTIFICATE.md) Full (strict) + auto-renew
- [ ] [HTTPS](HTTPS_CONFIGURATION.md) enforced + HSTS

## Security (✅ Mandatory + ⭐)
- [ ] [GitHub OAuth](GITHUB_OAUTH_REQUIREMENTS.md) configured, least scope
- [ ] [Security Headers](SECURITY_HEADERS.md) (CSP, HSTS, etc.) — securityheaders.com A
- [ ] [Secrets Management](SECRETS_MANAGEMENT.md): manager + KMS, gitleaks
- [ ] [Access Control](ACCESS_CONTROL_POLICY.md): ownership + roles + MFA
- [ ] [Backup Policy](BACKUP_POLICY.md): PITR + restore drill
- [ ] [security.txt](SECURITY_TXT.md) + [Security Contact](SECURITY_CONTACT.md) published
- [ ] [OWASP Top 10](OWASP_TOP10.md) reviewed; [Security Testing](../docs/SECURITY_TESTING.md) suites green

## Email & SEO (⭐)
- [ ] [SPF](SPF.md) + [DKIM](DKIM.md) + [DMARC](DMARC.md) configured
- [ ] [robots.txt](ROBOTS_TXT.md) + [sitemap.xml](SITEMAP_XML.md)

## Ops (⭐)
- [ ] [Logging](LOGGING_POLICY.md) + [Monitoring](SECURITY_MONITORING.md) live (redacted)
- [ ] [Incident Response](INCIDENT_RESPONSE_PLAN.md) + [DR](DISASTER_RECOVERY_PLAN.md) runbooks
- [ ] [Status Page](STATUS_PAGE.md) live
- [ ] [Accessibility](ACCESSIBILITY_WCAG.md) WCAG AA pass

## Product
- [ ] All 15 pages match prototype (UAT)
- [ ] Health/readiness probes; rollback tested
- [ ] [API Documentation](API_DOCUMENTATION.md) published

## Required Documents
- All linked docs above completed/verified.

## Implementation Guide
- Treat each unchecked ✅/⭐ item as a launch blocker; 🟡/🔵/🏢/💰 items are not blockers.

## Best Practices
- Re-run before every major release; keep dated sign-offs.

## Common Mistakes
- Launching with placeholder legal pages or untested backups.

## CodeVault-specific Notes
- Today: backend feature-complete + tested; **frontend pending**, OAuth creds + real domain pending. No payments/PHI → PCI/HIPAA not blockers.

## Future Considerations
- Add enterprise/payment gates ([SOC2_TYPE2](SOC2_TYPE2.md), [PCI_DSS](PCI_DSS.md)) when those markets are pursued.

## Checklist
- [ ] All ✅ Mandatory items above complete
- [ ] All ⭐ items complete or consciously deferred
- [ ] Sign-off recorded with date

## References
- [README.md](README.md) (full index) · [../docs/ROADMAP.md](../docs/ROADMAP.md) · [../docs/SECURITY_PLAN.md](../docs/SECURITY_PLAN.md)
