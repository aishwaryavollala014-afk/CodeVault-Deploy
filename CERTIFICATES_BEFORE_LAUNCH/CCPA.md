# 🇺🇸 CCPA / CPRA

> California's privacy law. Applies if CodeVault serves California residents and meets thresholds; mostly satisfied by GDPR-grade practices.

| Field | Detail |
|-------|--------|
| **Overview** | The California Consumer Privacy Act (as amended by CPRA) — consumer privacy rights for CA residents. |
| **Purpose** | Transparency + control over personal information; "Do Not Sell/Share". |
| **Category** | ⭐ Strongly Recommended Before Launch (Mandatory if in scope) |
| **Why it is needed** | CA users + business thresholds trigger CCPA obligations. |
| **Legally required?** | **Yes** if you meet thresholds (revenue, data volume, or selling data). |
| **Technically required?** | Drives disclosures + rights (know/delete/opt-out). |
| **When to implement** | Before serving CA users at scale. |
| **Priority** | 🟠 High (if in scope) |
| **Estimated Cost** | $0 (self-serve) → legal review at scale. |
| **Renewal** | Ongoing. |
| **Official Website** | https://oag.ca.gov/privacy/ccpa · https://cppa.ca.gov |
| **Eligibility** | Thresholds: >$25M revenue, or 100k+ consumers, or 50%+ revenue from selling data. |

## Step-by-Step Process
1. Determine if thresholds apply (likely not at early stage).
2. Privacy Policy discloses categories collected/shared + rights.
3. Implement **know/delete/opt-out**; CodeVault does **not sell** data — state so.
4. Honor requests within statutory timelines.

## Required Documents
- Privacy Policy with CCPA notices; data inventory.

## Implementation Guide
- Reuse GDPR rights machinery (export/delete) — CCPA largely overlaps.
- Add a "Do Not Sell or Share My Personal Information" statement (CodeVault doesn't sell → simple).

## Best Practices
- One privacy program covering GDPR + CCPA; clear "we don't sell data" stance.

## Common Mistakes
- Assuming non-applicability without checking thresholds; missing CA-specific disclosures.

## CodeVault-specific Notes
- CodeVault doesn't sell/share data → opt-out is trivial; GDPR readiness covers most CCPA needs.

## Future Considerations
- Other US state laws (VA/CO/CT) as they proliferate — a unified privacy program scales best.

## Checklist
- [ ] Threshold applicability assessed
- [ ] CCPA disclosures in Privacy Policy
- [ ] Know/delete/opt-out supported
- [ ] "Do not sell" statement
- [ ] Request timelines honored

## References
- [GDPR.md](GDPR.md) · [PRIVACY_POLICY.md](PRIVACY_POLICY.md) · [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md)
- oag.ca.gov/privacy/ccpa · cppa.ca.gov
