# 🏢 SOC 2 Type 2

> Attests CodeVault's controls operate **effectively over a period** (3–12 months). The gold standard enterprise buyers ask for — deferred until enterprise sales.

| Field | Detail |
|-------|--------|
| **Overview** | AICPA SOC 2 Type 2 report covering control **operating effectiveness** over an observation window. |
| **Purpose** | Strongest standard assurance for enterprise procurement. |
| **Category** | 🏢 Enterprise Only |
| **Why it is needed** | Mid/large enterprises mandate SOC 2 Type 2; irrelevant for a consumer launch. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | After Type 1 + when chasing enterprise revenue. |
| **Priority** | 🏢 Deferred (enterprise) |
| **Estimated Cost** | $20k–$60k+/yr (tooling + auditor + staff time). |
| **Renewal** | Annual (continuous evidence collection). |
| **Official Website** | https://www.aicpa-cima.com |
| **Eligibility** | Controls operating for the observation period. |

## Step-by-Step Process
1. Achieve [SOC2_TYPE1](SOC2_TYPE1.md) (design).
2. Operate controls for 3–12 months collecting evidence (Vanta/Drata).
3. Auditor tests operating effectiveness → Type 2 report.

## Required Documents
- All Type 1 docs + a period of evidence (access reviews, change logs, IR drills, monitoring).

## Implementation Guide
- Automate evidence (access reviews, CI security gates, monitoring) so the audit window is low-effort.

## Best Practices
- Continuous compliance tooling; quarterly access reviews; tabletop IR drills logged.

## Common Mistakes
- Treating it as one-time (it's continuous); thin evidence; scope creep.

## CodeVault-specific Notes
- **Not needed now.** The policies in this folder + [../docs/](../docs/) controls are the groundwork; activate when enterprise deals justify the spend.

## Future Considerations
- Combine with [ISO_27001](ISO_27001.md) + [CSA_STAR](CSA_STAR.md) Level 2 to reduce duplicate audits.

## Checklist
- [ ] Type 1 achieved
- [ ] Controls operating + evidence collected (3–12 mo)
- [ ] Continuous compliance tooling
- [ ] Annual auditor engagement

## References
- [SOC2_TYPE1.md](SOC2_TYPE1.md) · [ISO_27001.md](ISO_27001.md) · [THIRD_PARTY_SECURITY_AUDIT.md](THIRD_PARTY_SECURITY_AUDIT.md)
- AICPA SOC 2
