# 💾 Backup Policy

> Defines how CodeVault's PostgreSQL data is backed up, encrypted, and restore-tested. Mandatory before holding real user data.

| Field | Detail |
|-------|--------|
| **Overview** | Schedule, retention, encryption, and verification for database (and config) backups. |
| **Purpose** | Recover from deletion, corruption, or disaster with bounded data loss. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | Losing the DB = losing users, connections, sync history; backups must hold **ciphertext only**. |
| **Legally required?** | Indirectly (availability/integrity obligations). |
| **Technically required?** | **Yes** for any production data. |
| **When to implement** | Before launch. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | Usually included with managed Postgres; cross-region storage marginal. |
| **Renewal** | Continuous; quarterly restore drills. |
| **Official Website** | Managed-DB provider docs (Neon/Supabase/RDS). |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Enable automated daily full + continuous WAL (**PITR**) on Postgres.
2. Encrypt backups; store **keys separately** (KMS).
3. Copy backups cross-region.
4. **Restore drill** quarterly into an isolated instance + checksum + smoke test.

## Required Documents
- Backup schedule + retention + restore-drill log.

## Implementation Guide
- Redis is cache/queue — rebuildable (queue durable via AOF); DR scope focuses on Postgres.
- GitHub is the system of record for code → `problems` are re-derivable, narrowing backup criticality.

## Best Practices
- 3-2-1 (3 copies, 2 media, 1 offsite); test restores (a backup you haven't restored isn't a backup).
- RPO ≤ 15 min, RTO ≤ 1 hr targets.

## Common Mistakes
- Backups never restore-tested; keys stored with backups; no cross-region copy.

## CodeVault-specific Notes
- Mirrors [../docs/DISASTER_RECOVERY.md](../docs/DISASTER_RECOVERY.md) + [DATA_RETENTION_POLICY](DATA_RETENTION_POLICY.md).
- Backups contain encrypted tokens (ciphertext) — never store keys alongside.

## Future Considerations
- Continuously-verified automated restores; multi-region active-passive.

## Checklist
- [ ] Daily full + PITR enabled
- [ ] Backups encrypted; keys separate (KMS)
- [ ] Cross-region copies
- [ ] Quarterly restore drill + checksum
- [ ] RPO/RTO documented

## References
- [DISASTER_RECOVERY_PLAN.md](DISASTER_RECOVERY_PLAN.md) · [DATA_RETENTION_POLICY.md](DATA_RETENTION_POLICY.md) · [../docs/DISASTER_RECOVERY.md](../docs/DISASTER_RECOVERY.md)
