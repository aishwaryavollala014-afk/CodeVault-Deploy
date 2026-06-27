# 🔟 OWASP Top 10

> The baseline web-security checklist every CodeVault release should satisfy. Already heavily addressed in the engineering docs.

| Field | Detail |
|-------|--------|
| **Overview** | The OWASP Top 10 (2021) categories of the most critical web app risks. |
| **Purpose** | A shared, industry-standard security baseline. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Ensures CodeVault covers the highest-impact risk classes before launch. |
| **Legally required?** | No (but referenced by many standards). |
| **Technically required?** | Best practice; mapped to controls already built. |
| **When to implement** | Continuously; reviewed pre-launch. |
| **Priority** | 🔴 Critical (review) |
| **Estimated Cost** | $0. |
| **Renewal** | Re-review per release + on new OWASP version. |
| **Official Website** | https://owasp.org/Top10/ |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Map each category to a CodeVault control (below).
2. Verify via [../docs/SECURITY_TESTING.md](../docs/SECURITY_TESTING.md) suites.
3. Track gaps as issues; re-review each release.

## CodeVault mapping
| OWASP 2021 | CodeVault control |
|------------|-------------------|
| A01 Broken Access Control | ownership from JWT; cuid ids; field allowlists |
| A02 Cryptographic Failures | AES-256-GCM tokens; TLS; hashed refresh tokens |
| A03 Injection | Prisma params; Zod; no `queryRawUnsafe` |
| A04 Insecure Design | layered architecture; threat model (SECURITY_PLAN) |
| A05 Security Misconfig | Helmet, strict CORS, fail-fast env |
| A06 Vulnerable Components | Dependabot/SCA; pinned deps |
| A07 Auth Failures | OAuth+state, JWT verify both services, refresh rotation |
| A08 Integrity Failures | signed/pinned CI; lockfiles; SBOM (planned) |
| A09 Logging/Monitoring | pino + redaction; alerts (MONITORING) |
| A10 SSRF | username validation + egress allowlist |

## Required Documents
- None.

## Implementation Guide
- Cross-reference [../docs/ATTACK_PREVENTION.md](../docs/ATTACK_PREVENTION.md) (per-attack detail).

## Best Practices
- Treat the Top 10 as a floor, not a ceiling; add ASVS for depth ([OWASP_ASVS](OWASP_ASVS.md)).

## Common Mistakes
- Checkbox security without testing; ignoring A04/A08 (design + supply chain).

## CodeVault-specific Notes
- Most controls are implemented + several manually verified; codify as automated security tests.

## Future Considerations
- Adopt OWASP ASVS L1→L2 as the product matures.

## Checklist
- [ ] Each A0x mapped to a control
- [ ] Security test suites cover A01/A03/A07/A10
- [ ] SCA + secret scan in CI
- [ ] Re-reviewed this release

## References
- [OWASP_ASVS.md](OWASP_ASVS.md) · [../docs/SECURITY_PLAN.md](../docs/SECURITY_PLAN.md) · [../docs/ATTACK_PREVENTION.md](../docs/ATTACK_PREVENTION.md) · [../docs/SECURITY_TESTING.md](../docs/SECURITY_TESTING.md)
- owasp.org/Top10
