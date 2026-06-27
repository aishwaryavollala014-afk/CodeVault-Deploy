# 🛡️ security.txt

> A machine-readable file at `/.well-known/security.txt` telling researchers how to report vulnerabilities in CodeVault.

| Field | Detail |
|-------|--------|
| **Overview** | RFC 9116 standard file listing a security contact + disclosure policy. |
| **Purpose** | Give ethical hackers a clear, trusted reporting channel. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Reduces friction for responsible disclosure; signals security maturity. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | Before / shortly after launch. |
| **Priority** | 🟢 Low effort, high value |
| **Estimated Cost** | $0. |
| **Renewal** | Update `Expires` (≤ 1 year) + contact changes. |
| **Official Website** | https://securitytxt.org · RFC 9116 |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Create `/.well-known/security.txt` (served by the frontend/edge).
2. Fields: `Contact:`, `Expires:`, `Encryption:` (PGP, optional), `Policy:` (link to [VULNERABILITY_DISCLOSURE_POLICY](VULNERABILITY_DISCLOSURE_POLICY.md)), `Preferred-Languages:`.
3. Optionally sign with PGP.

## Required Documents
- A security contact (email/page) — see [SECURITY_CONTACT](SECURITY_CONTACT.md).

## Implementation Guide
- Serve as a static file from `web-frontend/public/.well-known/security.txt` (and `/security.txt` redirect).

## Best Practices
- Use a role address (`security@<domain>`); keep `Expires` current; link the policy.

## Common Mistakes
- Expired file; personal email; pointing to a dead policy link.

## CodeVault-specific Notes
- Pair with [RESPONSIBLE_DISCLOSURE](RESPONSIBLE_DISCLOSURE.md); reference the disclosure policy URL.

## Future Considerations
- Add a bug-bounty link when one launches (see [BUG_BOUNTY_PROGRAM](BUG_BOUNTY_PROGRAM.md)).

## Checklist
- [ ] `/.well-known/security.txt` served
- [ ] Contact + Expires + Policy fields set
- [ ] Role-based security email
- [ ] Expiry monitored

## References
- [SECURITY_CONTACT.md](SECURITY_CONTACT.md) · [VULNERABILITY_DISCLOSURE_POLICY.md](VULNERABILITY_DISCLOSURE_POLICY.md) · [RESPONSIBLE_DISCLOSURE.md](RESPONSIBLE_DISCLOSURE.md)
- securitytxt.org · RFC 9116
