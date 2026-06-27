# 🔑 Password Policy

> CodeVault is **passwordless** (GitHub OAuth only) — so this policy mostly documents *why there are no passwords* and governs any future credential.

| Field | Detail |
|-------|--------|
| **Overview** | Policy for credential handling; today CodeVault has no user passwords. |
| **Purpose** | Eliminate the password-attack class; define rules if a credential is ever added. |
| **Category** | ⭐ Strongly Recommended Before Launch (documentation) |
| **Why it is needed** | Clarifies the passwordless stance; covers admin/service credential hygiene. |
| **Legally required?** | No. |
| **Technically required?** | N/A for users (OAuth). |
| **When to implement** | Document at launch. |
| **Priority** | 🟡 Medium |
| **Estimated Cost** | $0. |
| **Renewal** | Review if auth model changes. |
| **Official Website** | https://pages.nist.gov/800-63-3/ |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Confirm user auth is **OAuth-only** — no passwords stored or accepted.
2. For admin/infra/3rd-party accounts: enforce strong passwords + **MFA** + a manager.
3. If a fallback credential is ever added: Argon2id hashing, breach-check (HIBP), length-based rules.

## Required Documents
- Credential inventory (admin/service accounts).

## Implementation Guide
- Users: GitHub handles auth + MFA (delegated).
- Refresh tokens stored **hashed** (SHA-256), rotated — see [../docs/AUTH_SECURITY.md](../docs/AUTH_SECURITY.md).

## Best Practices
- Follow NIST 800-63B: length over complexity; no forced rotation; breach-check; MFA.
- Never store plaintext credentials anywhere.

## Common Mistakes
- Adding a weak password fallback "for convenience"; storing API keys like passwords in code.

## CodeVault-specific Notes
- **No user passwords by design.** Policy mainly governs maintainer + cloud + registrar accounts (use MFA + a password manager).

## Future Considerations
- Passkeys (WebAuthn) if a non-GitHub login is ever offered.

## Checklist
- [ ] User auth confirmed passwordless (OAuth)
- [ ] Admin/infra accounts: strong password + MFA + manager
- [ ] Refresh tokens hashed + rotated
- [ ] Argon2id + breach-check IF a credential is ever added

## References
- [ACCESS_CONTROL_POLICY.md](ACCESS_CONTROL_POLICY.md) · [../docs/AUTH_SECURITY.md](../docs/AUTH_SECURITY.md)
- NIST SP 800-63B
