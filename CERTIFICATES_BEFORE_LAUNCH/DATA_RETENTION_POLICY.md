# 🗃️ Data Retention Policy

> How long CodeVault keeps each data type and when it's deleted — central to GDPR/CCPA compliance and data minimization.

| Field | Detail |
|-------|--------|
| **Overview** | Defined retention + deletion schedules per data category. |
| **Purpose** | Minimize stored data; satisfy "storage limitation" principle; enable deletion. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | CodeVault stores PII + tokens; over-retention increases breach + compliance risk. |
| **Legally required?** | GDPR/CCPA require defined retention + deletion. |
| **Technically required?** | Drives purge jobs + log TTLs. |
| **When to implement** | Before launch. |
| **Priority** | 🟠 High |
| **Estimated Cost** | $0. |
| **Renewal** | Annual review. |
| **Official Website** | https://gdpr.eu |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Classify data: account (users), connections+tokens, problems/sync_runs, logs, audit.
2. Set retention: tokens purged on disconnect/delete; logs 30/90d; audit 1yr; account on deletion.
3. Implement purge jobs + log TTLs; document the schedule.

## Required Documents
- Retention matrix (data type → retention → deletion trigger).

## Implementation Guide
- Account deletion soft-deletes user + **hard-purges `connection_secrets`** + revokes sessions (see [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md)).
- Redis cache TTLs (10–15 min) already enforce ephemerality.

## Best Practices
- Keep the minimum; document every retention period; automate purges.

## Common Mistakes
- Indefinite logs; tokens lingering after disconnect; no documented schedule.

## CodeVault-specific Notes
- **No code in DB** (lives in GitHub) and **no payment data** → small retention surface.
- Retention matrix mirrors [BACKUP_POLICY](BACKUP_POLICY.md) + [LOGGING_POLICY](LOGGING_POLICY.md).

## Future Considerations
- Per-region retention; user-configurable data lifetimes.

## Checklist
- [ ] Retention matrix documented
- [ ] Token purge on disconnect/delete
- [ ] Log TTLs (30/90d); audit 1yr
- [ ] Purge jobs implemented
- [ ] Annual review

## References
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) · [BACKUP_POLICY.md](BACKUP_POLICY.md) · [LOGGING_POLICY.md](LOGGING_POLICY.md) · [GDPR.md](GDPR.md) · [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md)
