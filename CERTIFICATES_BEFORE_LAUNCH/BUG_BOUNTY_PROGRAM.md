# 💵 Bug Bounty Program

> Paying external researchers for valid vulnerabilities — an evolution of the VDP once CodeVault has scale + budget.

| Field | Detail |
|-------|--------|
| **Overview** | A program (self-run or via HackerOne/Bugcrowd) rewarding disclosed vulnerabilities. |
| **Purpose** | Crowdsource continuous security testing. |
| **Category** | 🟡 Recommended After Launch (at scale) |
| **Why it is needed** | Ongoing coverage beyond periodic pentests; signals maturity. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | After a VDP + meaningful user base + budget. |
| **Priority** | 🟡 Medium (later) |
| **Estimated Cost** | Variable: bounties + platform fees ($k–$tens of k/yr). |
| **Renewal** | Ongoing. |
| **Official Website** | https://www.hackerone.com · https://bugcrowd.com |
| **Eligibility** | A mature VDP + capacity to triage/pay. |

## Step-by-Step Process
1. Start with a public [VDP](VULNERABILITY_DISCLOSURE_POLICY.md) (no payment).
2. When ready: define scope + reward tiers; choose a platform or self-host.
3. Triage, reward, fix, disclose; track metrics.

## Required Documents
- Program policy; scope; reward table; safe harbor.

## Implementation Guide
- Begin private (invite-only) → public; clear out-of-scope (third-party platforms, DoS).

## Best Practices
- Fast triage + payment; fair rewards; transparency; researcher recognition.

## Common Mistakes
- Launching before able to triage (backlog + reputation damage); vague scope.

## CodeVault-specific Notes
- Don't start until VDP + on-call triage exist; token-handling bugs warrant higher tiers.

## Future Considerations
- Tiered rewards; private→public expansion; CVE coordination.

## Checklist
- [ ] VDP live first
- [ ] Scope + reward tiers defined
- [ ] Triage capacity in place
- [ ] Platform chosen (or self-host)
- [ ] Safe harbor + recognition

## References
- [VULNERABILITY_DISCLOSURE_POLICY.md](VULNERABILITY_DISCLOSURE_POLICY.md) · [RESPONSIBLE_DISCLOSURE.md](RESPONSIBLE_DISCLOSURE.md) · [PENETRATION_TESTING.md](PENETRATION_TESTING.md)
- HackerOne · Bugcrowd
