# 📧 SPF (Sender Policy Framework)

> A DNS TXT record declaring which servers may send email for CodeVault's domain — the first pillar of email authentication.

| Field | Detail |
|-------|--------|
| **Overview** | SPF lists authorized mail senders; receivers reject/flag mail from others. |
| **Purpose** | Prevent spoofing of CodeVault's domain; improve deliverability. |
| **Category** | ⭐ Strongly Recommended Before Launch (if sending email) |
| **Why it is needed** | CodeVault will send transactional email (sync alerts, expiry, account); SPF stops spoofers. |
| **Legally required?** | No. |
| **Technically required?** | Required for reliable email delivery. |
| **When to implement** | Before sending any email. |
| **Priority** | 🟠 High (when email is added) |
| **Estimated Cost** | $0 (a DNS record). |
| **Renewal** | Update when changing email providers. |
| **Official Website** | https://www.rfc-editor.org/rfc/rfc7208 |
| **Eligibility** | Domain control. |

## Step-by-Step Process
1. Pick an email provider (e.g. Resend/Postmark/SES).
2. Add one TXT record: `v=spf1 include:<provider> -all`.
3. Verify with an SPF checker; pair with [DKIM](DKIM.md) + [DMARC](DMARC.md).

## Required Documents
- None.

## Implementation Guide
- Exactly **one** SPF record; merge providers via `include:`; end with `-all` (hard fail) once confident.

## Best Practices
- Use `-all` (not `~all`) after validation; keep within the 10-DNS-lookup limit.

## Common Mistakes
- Multiple SPF records (invalid); exceeding 10 lookups; `+all` (allows anyone).

## CodeVault-specific Notes
- Until transactional email ships, this is N/A; configure before the first email send.
- Use a subdomain (e.g. `mail.<domain>`) for sending to isolate reputation.

## Future Considerations
- Dedicated IP + warmup at high volume.

## Checklist
- [ ] Single SPF TXT record
- [ ] Provider `include:` correct
- [ ] `-all` after validation
- [ ] ≤ 10 DNS lookups
- [ ] Paired with DKIM + DMARC

## References
- [DKIM.md](DKIM.md) · [DMARC.md](DMARC.md) · [EMAIL_AUTHENTICATION.md](EMAIL_AUTHENTICATION.md) · [DNS_CONFIGURATION.md](DNS_CONFIGURATION.md)
- RFC 7208
