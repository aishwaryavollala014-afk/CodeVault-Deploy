# 📜 Terms of Service

> The contract between CodeVault and its users — limits liability and discloses the third-party-token risk inherent in code sync.

| Field | Detail |
|-------|--------|
| **Overview** | Legal terms governing acceptable use, disclaimers, liability limits, and termination. |
| **Purpose** | Set rules of use; limit liability; disclose platform-ToS risks. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | CodeVault accesses users' platform accounts (Path B) and writes to their GitHub repos — high-risk capabilities needing clear terms + consent. |
| **Legally required?** | Not strictly, but **strongly advised**; protects the project legally. |
| **Technically required?** | No. |
| **When to implement** | Before launch; accept at sign-up / connect. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | $0 (template) → $500–$2k (counsel). |
| **Renewal** | Version on change; require re-acceptance for material changes. |
| **Official Website** | (template sources) https://www.termsfeed.com · https://commonpaper.com |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Draft: eligibility, acceptable use, user responsibilities, IP, disclaimers, limitation of liability, termination, governing law.
2. Add a **platform-ToS disclosure**: storing session tokens may conflict with platform ToS; user authorizes their own data retrieval.
3. Publish at `/terms`; link in footer + require acceptance at connect-authorize.

## Required Documents
- None.

## Implementation Guide
- Static page in `web-frontend`. Record acceptance in `audit_logs`.
- Reference the Privacy & Cookie policies.

## Best Practices
- Clear acceptable-use (no abuse of others' data; own-data-only).
- Explicit "as-is" disclaimer; cap liability; define termination/deletion.

## Common Mistakes
- No platform-ToS risk disclosure (legal exposure for Path B).
- Unreadable boilerplate; no acceptance record.

## CodeVault-specific Notes
- State that sync fetches **only the user's own** submissions/code, with consent, stored encrypted, deleted on disconnect.
- Prefer official APIs (Codeforces) where available to reduce ToS reliance.

## Future Considerations
- Separate enterprise MSA; SLA terms when paid plans arrive (see [PCI_DSS](PCI_DSS.md)).

## Checklist
- [ ] `/terms` page live + linked
- [ ] Acceptable use + own-data-only stated
- [ ] Platform-ToS risk disclosed
- [ ] Liability limited; as-is disclaimer
- [ ] Acceptance recorded; versioned

## References
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) · [END_USER_LICENSE_AGREEMENT.md](END_USER_LICENSE_AGREEMENT.md) · [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md) · [../docs/PLATFORM_INTEGRATION.md](../docs/PLATFORM_INTEGRATION.md)
