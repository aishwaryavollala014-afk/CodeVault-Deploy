# ✍️ Contributor License Agreement (CLA)

> Ensures CodeVault has clear rights to contributions if the repo accepts outside contributors. A lightweight DCO is often enough.

| Field | Detail |
|-------|--------|
| **Overview** | An agreement (CLA) or sign-off (DCO) by which contributors grant CodeVault rights to their contributions. |
| **Purpose** | Clean chain of title; avoid IP disputes over contributed code. |
| **Category** | 🟡 Recommended After Launch (if accepting contributions) |
| **Why it is needed** | Without it, contributors retain rights, complicating licensing/relicensing. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | Before accepting external PRs. |
| **Priority** | 🟡 Low (until external contributions) |
| **Estimated Cost** | $0 (DCO) → minor (CLA tooling). |
| **Renewal** | N/A. |
| **Official Website** | https://developercertificate.org · https://cla-assistant.io |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Choose **DCO** (simple `Signed-off-by` per commit) vs **CLA** (signed agreement).
2. For DCO: enforce sign-off via a GitHub check.
3. For CLA: use CLA Assistant to gate PRs.

## Required Documents
- DCO text or CLA document.

## Implementation Guide
- For a small project, **DCO** is lightweight + sufficient; CLA when corporate contributions or relicensing are likely.

## Best Practices
- Decide before the first external PR; automate enforcement; keep records.

## Common Mistakes
- Merging external code with no IP grant; inconsistent enforcement.

## CodeVault-specific Notes
- Internal-only today (Gaurav + Aishwarya). Add DCO/CLA before opening to outside contributors. Note: CodeVault uses **no AI co-author trailers** — keep attribution to human authors only.

## Future Considerations
- CLA if dual-licensing / commercial OSS model emerges.

## Checklist
- [ ] DCO vs CLA decided
- [ ] Automated enforcement (sign-off check / CLA Assistant)
- [ ] Applied before external contributions

## References
- [OPEN_SOURCE_LICENSE.md](OPEN_SOURCE_LICENSE.md) · [COPYRIGHT.md](COPYRIGHT.md)
- developercertificate.org · cla-assistant.io
