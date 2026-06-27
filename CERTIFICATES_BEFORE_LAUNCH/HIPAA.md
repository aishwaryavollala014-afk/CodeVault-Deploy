# 🏥 HIPAA

> US health-data law. **Not applicable to CodeVault** — it processes no Protected Health Information (PHI). Documented here for completeness.

| Field | Detail |
|-------|--------|
| **Overview** | Health Insurance Portability and Accountability Act — governs PHI handling by covered entities + business associates. |
| **Purpose** | Protect health information. |
| **Category** | 🏢 Enterprise Only (Healthcare) |
| **Why it is needed** | **Only** if CodeVault ever stored/processed PHI — which it does **not**. |
| **Legally required?** | Only if handling PHI as a covered entity/business associate. |
| **Technically required?** | No. |
| **When to implement** | Only on a (very unlikely) healthcare pivot. |
| **Priority** | ⚪ Not applicable |
| **Estimated Cost** | Significant (BAAs, audits, controls) — irrelevant unless PHI is involved. |
| **Renewal** | Ongoing if applicable. |
| **Official Website** | https://www.hhs.gov/hipaa |
| **Eligibility** | Handling PHI. |

## Step-by-Step Process
1. Determine if any PHI is processed → for CodeVault, **no**.
2. (If ever applicable) sign BAAs, implement Privacy/Security/Breach rules, train staff, audit.

## Required Documents
- N/A for CodeVault (no PHI).

## Implementation Guide
- No action required. CodeVault stores GitHub email/handle + coding stats + encrypted tokens — **none of which is PHI**.

## Best Practices
- Avoid collecting health data so HIPAA never applies.

## Common Mistakes
- Assuming HIPAA applies to all user data (it only covers PHI).

## CodeVault-specific Notes
- **Not applicable.** CodeVault is a competitive-programming analytics + GitHub-sync tool — no health data. This file exists only to explicitly record non-applicability.

## Future Considerations
- Would only matter if CodeVault pivoted into health-tech (architecturally different product).

## Checklist
- [ ] Confirmed: no PHI processed (true today)
- [ ] Re-evaluate only if a health-data feature is ever proposed

## References
- [GDPR.md](GDPR.md) · [CCPA.md](CCPA.md) · [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md)
- hhs.gov/hipaa
