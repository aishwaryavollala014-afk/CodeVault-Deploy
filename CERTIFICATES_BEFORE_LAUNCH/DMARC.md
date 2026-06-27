# 🛡️ DMARC

> Ties SPF + DKIM together with a policy telling receivers what to do with unauthenticated mail claiming to be from CodeVault — and sends reports.

| Field | Detail |
|-------|--------|
| **Overview** | A DNS TXT policy (`_dmarc.<domain>`) enforcing SPF/DKIM alignment + aggregate reporting. |
| **Purpose** | Stop domain spoofing/phishing; gain visibility via reports. |
| **Category** | ⭐ Strongly Recommended Before Launch (if sending email) |
| **Why it is needed** | Completes email authentication; protects CodeVault's brand from phishing. |
| **Legally required?** | No. |
| **Technically required?** | Increasingly required by major inboxes (Gmail/Yahoo bulk-sender rules). |
| **When to implement** | After SPF + DKIM pass. |
| **Priority** | 🟠 High (when email is added) |
| **Estimated Cost** | $0 (record) + optional report-analyzer SaaS. |
| **Renewal** | Tighten policy over time. |
| **Official Website** | https://dmarc.org |
| **Eligibility** | SPF + DKIM in place. |

## Step-by-Step Process
1. Publish `_dmarc` TXT starting at `p=none` (monitor) with `rua=mailto:dmarc@<domain>`.
2. Analyze aggregate reports; fix alignment gaps.
3. Move `p=quarantine` → `p=reject` once clean.

## Required Documents
- None.

## Implementation Guide
- Example: `v=DMARC1; p=none; rua=mailto:dmarc@<domain>; fo=1; adkim=s; aspf=s`.
- Use a report analyzer (e.g. Postmark DMARC, Dmarcian).

## Best Practices
- Start `none`, end `reject`; strict alignment; monitor reports before tightening.

## Common Mistakes
- Jumping to `reject` before validating (drops legit mail).
- No `rua` (flying blind).

## CodeVault-specific Notes
- N/A until email ships; required to keep transactional alerts (sync/expiry) out of spam.

## Future Considerations
- BIMI (verified logo) after `p=reject`.

## Checklist
- [ ] `_dmarc` published at `p=none` + `rua`
- [ ] Reports analyzed; alignment fixed
- [ ] Policy escalated to `quarantine`→`reject`
- [ ] SPF + DKIM aligned

## References
- [SPF.md](SPF.md) · [DKIM.md](DKIM.md) · [EMAIL_AUTHENTICATION.md](EMAIL_AUTHENTICATION.md)
- dmarc.org
