# 🍪 Cookie Policy

> CodeVault uses **essential** cookies only (auth). A short cookie notice keeps it compliant without a heavy consent banner.

| Field | Detail |
|-------|--------|
| **Overview** | Document describing the cookies CodeVault sets, their purpose, and lifetime. |
| **Purpose** | Transparency + ePrivacy/GDPR compliance for cookie use. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | CodeVault sets `cv_access` / `cv_refresh` httpOnly auth cookies; users must be informed. |
| **Legally required?** | **Yes** in EU/UK (ePrivacy) — though essential cookies need disclosure, not opt-in consent. |
| **Technically required?** | No. |
| **When to implement** | Before launch. |
| **Priority** | 🟠 High |
| **Estimated Cost** | $0. |
| **Renewal** | Update if cookies change. |
| **Official Website** | https://gdpr.eu/cookies/ |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Inventory cookies: `cv_access` (session JWT), `cv_refresh` (rotation) — both **essential**, httpOnly, Secure, SameSite=Lax.
2. Document name, purpose, type (essential), lifetime.
3. Publish `/cookies` (or a section in Privacy). Add a minimal notice; full banner only if non-essential cookies are added.

## Required Documents
- Cookie inventory.

## Implementation Guide
- Static page in `web-frontend`. Keep all cookies essential → no opt-in needed, minimal banner.

## Best Practices
- Keep cookies essential; avoid third-party tracking cookies.
- httpOnly + Secure + SameSite on all auth cookies.

## Common Mistakes
- Adding analytics/tracking cookies without consent UI.
- Listing cookies inaccurately.

## CodeVault-specific Notes
- Only first-party essential cookies today → minimal compliance burden.
- If product analytics (e.g. PostHog) is added later, introduce a consent banner.

## Future Considerations
- Consent Management Platform if marketing/analytics cookies are introduced.

## Checklist
- [ ] Cookie inventory documented
- [ ] `/cookies` page or Privacy section live
- [ ] All cookies essential, httpOnly+Secure+SameSite
- [ ] Banner plan if non-essential cookies added

## References
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) · [GDPR.md](GDPR.md) · [../docs/AUTH_SECURITY.md](../docs/AUTH_SECURITY.md)
