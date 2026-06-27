# 📨 Security Contact

> A monitored, role-based channel for security reports — referenced by `security.txt`, the VDP, and the Privacy Policy.

| Field | Detail |
|-------|--------|
| **Overview** | A dedicated security email/page (e.g. `security@<domain>`) staffed + monitored. |
| **Purpose** | Single trusted destination for vulnerability + abuse reports. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | `security.txt` + VDP must point somewhere real + monitored. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | With security.txt. |
| **Priority** | 🟢 Low effort |
| **Estimated Cost** | $0 (email alias). |
| **Renewal** | Verify monitoring periodically. |
| **Official Website** | — |
| **Eligibility** | Domain + mailbox. |

## Step-by-Step Process
1. Create `security@<domain>` (alias to a monitored inbox / on-call).
2. (Optional) Publish a PGP key for encrypted reports.
3. Reference it in `security.txt`, VDP, Privacy Policy.

## Required Documents
- None.

## Implementation Guide
- Route to a ticketing system or on-call rotation; auto-acknowledge receipt.

## Best Practices
- Role address (not personal); monitored daily; fast acknowledgment.

## Common Mistakes
- Unmonitored alias; personal email; no acknowledgment.

## CodeVault-specific Notes
- Pre-launch, can route to the maintainers' shared inbox; formalize on-call as you scale.

## Future Considerations
- Dedicated triage tooling; bug-bounty intake.

## Checklist
- [ ] `security@<domain>` created + monitored
- [ ] Referenced in security.txt + VDP + Privacy
- [ ] Auto-acknowledgment
- [ ] Optional PGP key

## References
- [SECURITY_TXT.md](SECURITY_TXT.md) · [VULNERABILITY_DISCLOSURE_POLICY.md](VULNERABILITY_DISCLOSURE_POLICY.md) · [RESPONSIBLE_DISCLOSURE.md](RESPONSIBLE_DISCLOSURE.md)
