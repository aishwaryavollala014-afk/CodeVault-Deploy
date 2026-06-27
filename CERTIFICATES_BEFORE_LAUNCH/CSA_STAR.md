# ☁️ CSA STAR

> Cloud Security Alliance STAR — a cloud-specific trust registry/certification. Relevant only when selling to security-conscious cloud/enterprise buyers.

| Field | Detail |
|-------|--------|
| **Overview** | CSA Security, Trust, Assurance and Risk program (self-assessment → certification) built on the Cloud Controls Matrix (CCM). |
| **Purpose** | Demonstrate cloud security posture in a recognized public registry. |
| **Category** | 🔵 Required During Scaling (🏢 enterprise-leaning) |
| **Why it is needed** | Some enterprise/cloud buyers check the CSA STAR registry during vendor review. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | During scaling / enterprise push; STAR Level 1 (self-assessment) is cheap. |
| **Priority** | 🔵 Low-Medium |
| **Estimated Cost** | Level 1 (CAIQ self-assessment): low/free; Level 2 (certification): audit cost. |
| **Renewal** | Per program (annual-ish). |
| **Official Website** | https://cloudsecurityalliance.org/star/ |
| **Eligibility** | A cloud service + completed CAIQ. |

## Step-by-Step Process
1. Complete the **CAIQ** (Consensus Assessment Initiative Questionnaire) against CCM.
2. Submit for **STAR Level 1** (self-assessment, listed publicly).
3. Pursue **Level 2** (third-party, often combined with SOC2/ISO 27001) if buyers require.

## Required Documents
- CAIQ; supporting security docs.

## Implementation Guide
- Start with Level 1 self-assessment using this repo's security docs to answer CCM controls.

## Best Practices
- Align CCM answers with actual controls; combine Level 2 with ISO 27001 to reduce duplicate audits.

## Common Mistakes
- Overstating controls in the CAIQ; pursuing Level 2 prematurely.

## CodeVault-specific Notes
- Not needed pre-launch. Level 1 is a low-cost trust signal once chasing enterprise/cloud deals.

## Future Considerations
- STAR Level 2 bundled with [ISO_27001](ISO_27001.md)/[SOC2_TYPE2](SOC2_TYPE2.md).

## Checklist
- [ ] CAIQ completed
- [ ] STAR Level 1 listed (when pursuing enterprise)
- [ ] Level 2 considered with ISO/SOC2

## References
- [ISO_27001.md](ISO_27001.md) · [SOC2_TYPE2.md](SOC2_TYPE2.md) · [THIRD_PARTY_SECURITY_AUDIT.md](THIRD_PARTY_SECURITY_AUDIT.md)
- cloudsecurityalliance.org/star
