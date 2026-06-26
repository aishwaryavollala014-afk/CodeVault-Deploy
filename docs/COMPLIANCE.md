# 📜 CodeVault — Compliance & Privacy

> CodeVault's privacy posture and GDPR-ready architecture. Companion to [SECURITY_PLAN](SECURITY_PLAN.md) (§14), [DATABASE_SECURITY](DATABASE_SECURITY.md), and [AUTH_SECURITY](AUTH_SECURITY.md).

---

## 1. Purpose

Handle user data lawfully and minimally: store only what's needed, let users export/delete their data, retain an audit trail, and clearly disclose the third-party-token risk inherent in code sync.

---

## 2. Architecture (data inventory)

```
Stored: githubLogin, handle, displayName, email(optional), avatarUrl  → PII (minimal)
        connections (handles), encrypted tokens                       → crown jewels
        problems/sync_runs/stats_snapshots                            → derived (re-derivable)
        audit_logs                                                    → security trail (1 yr)
Not stored: passwords (OAuth-only), solution code (lives in GitHub), payment data (none)
```

---

## 3. Best Practices

- **Data minimization** — store handles + encrypted tokens + derived stats; **no code in DB**.
- **Consent at connect-time** — explicit, scoped, with token-handling disclosure.
- **Right to delete + export** — first-class flows.
- **Audit trail** — append-only `audit_logs` for security-relevant actions.
- **Secure retention** — TTLs on logs; purge tokens on disconnect/delete.

---

## 4. Threats / Compliance Risks

Excessive data exposure (email/tokens in public profile) · incomplete deletion (orphan tokens) · missing consent for token storage · ToS/legal risk of storing platform session cookies · cross-border data transfer · over-long retention.

---

## 5. Prevention Techniques

| Risk | Control |
|------|---------|
| Excessive exposure | public profile returns public-only fields; uniform 404 |
| Incomplete deletion | soft-delete user → **hard-purge `connection_secrets`** + revoke tokens + cascade |
| Missing consent | connect-authorize flow displays scope + handling + privacy link |
| ToS/legal risk | disclose session-token storage in ToS; prefer official APIs (Codeforces) |
| Cross-border | DPAs with sub-processors (GitHub, hosting); data-residency awareness |
| Over-retention | log TTLs (30/90d), audit 1yr; minimize PII |

---

## 6. Implementation Guidelines

- Account deletion (`DELETE /users/me`) soft-deletes the user and revokes sessions; a purge job hard-deletes secrets + cascades owned rows.
- Data export: assemble connections, stats, settings (no tokens) on request.
- Consent UI gates the authorize step; record consent timestamp in `audit_logs`.

---

## 7. Folder Structure

```
web-backend/src/services/user.service.ts       # soft-delete + session revoke
web-backend/src/services/settings.service.ts    # public visibility controls
docs/COMPLIANCE.md                               # this guide
(legal) Privacy Policy + Terms of Service pages  # frontend (marketing)
```

---

## 8. Recommended Tools / Frameworks

GDPR / CCPA principles, DPA templates, cookie-consent banner (keep cookies essential → minimal banner), audit-log tooling.

---

## 9. Configuration Examples

```
Retention: app logs 30d · auth/authz logs 90d · audit_logs 365d
Deletion SLA: tokens purged immediately on disconnect/delete; full purge job ≤ 24h
Export: connections + stats + settings (machine-readable), excludes secrets
```

---

## 10. Production Considerations

- Keep Privacy Policy + ToS current; disclose the platform-token risk explicitly.
- Provide a contact/support channel for data requests.
- GDPR breach notification within **72h** if PII is exposed.
- Cookie notice if any non-essential cookies are introduced.

---

## 11. Future Improvements

- Self-service data export + deletion in the UI.
- Consent versioning + re-consent on policy change.
- Regional data residency options.

---

## 12. Checklist

- [ ] Data minimized; no code/passwords/payment data stored
- [ ] Consent at connect-authorize (scope + handling disclosed)
- [ ] Delete purges tokens + revokes; export available
- [ ] Public profile exposes no email/tokens
- [ ] Audit log append-only, 1-year retention; log TTLs set
- [ ] ToS discloses platform-token storage risk
- [ ] DPAs with sub-processors; breach-notification process

---

## 13. References

- [SECURITY_PLAN.md](SECURITY_PLAN.md) §14 · [DATABASE_SECURITY.md](DATABASE_SECURITY.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md) · [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)
- GDPR · CCPA · OWASP Privacy Risks
