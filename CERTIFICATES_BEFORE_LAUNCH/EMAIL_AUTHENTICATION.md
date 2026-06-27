# ✉️ Email Authentication (overview)

> The umbrella for CodeVault's email trust stack: SPF + DKIM + DMARC (+ BIMI later). This doc ties the three together.

| Field | Detail |
|-------|--------|
| **Overview** | Coordinated configuration of SPF, DKIM, and DMARC for CodeVault's sending domain. |
| **Purpose** | Ensure transactional email is delivered, trusted, and unspoofable. |
| **Category** | ⭐ Strongly Recommended Before Launch (if sending email) |
| **Why it is needed** | Sync/expiry/account emails must reach inboxes and not be forgeable. |
| **Legally required?** | No. |
| **Technically required?** | Required for deliverability (Gmail/Yahoo bulk-sender rules). |
| **When to implement** | Before the first email send. |
| **Priority** | 🟠 High (when email is added) |
| **Estimated Cost** | $0–$ (provider + optional DMARC analytics). |
| **Renewal** | Key rotation; policy tightening. |
| **Official Website** | https://www.rfc-editor.org · provider docs |
| **Eligibility** | Domain + email provider. |

## Step-by-Step Process
1. Choose a provider (Resend/Postmark/SES) + a sending subdomain.
2. Configure [SPF](SPF.md) → [DKIM](DKIM.md) → [DMARC](DMARC.md) (in that order).
3. Verify all three pass; monitor DMARC reports.

## Required Documents
- None.

## Implementation Guide
- Centralize sending through one provider; isolate marketing vs transactional streams.
- See [VERIFIED_SENDING_DOMAIN](VERIFIED_SENDING_DOMAIN.md) for provider domain verification.

## Best Practices
- Dedicated sending subdomain; DMARC `reject` once stable; consistent From address.

## Common Mistakes
- Sending from an unauthenticated domain (spam/phishing flags).
- Mixing transactional + bulk on one reputation.

## CodeVault-specific Notes
- Likely transactional triggers: sync complete, session expired (reconnect), account/security notices.
- Keep email **optional** to send (notifications are also in-app).

## Future Considerations
- BIMI; per-stream reputation; localized email.

## Checklist
- [ ] Provider + sending subdomain chosen
- [ ] SPF + DKIM + DMARC all pass
- [ ] Transactional/marketing streams separated
- [ ] DMARC reports monitored

## References
- [SPF.md](SPF.md) · [DKIM.md](DKIM.md) · [DMARC.md](DMARC.md) · [VERIFIED_SENDING_DOMAIN.md](VERIFIED_SENDING_DOMAIN.md)
