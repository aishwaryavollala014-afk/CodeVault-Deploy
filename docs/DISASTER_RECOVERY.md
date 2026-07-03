# 🌪️ CodeVault — Disaster Recovery

> CodeVault's plan for backups, recovery, failover, and business continuity. Companion to [DATABASE_SECURITY](DATABASE_SECURITY.md), [INFRASTRUCTURE_SECURITY](INFRASTRUCTURE_SECURITY.md), and [MONITORING](MONITORING.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Guarantee CodeVault can recover from data loss, region failure, or a security incident with bounded data loss (**RPO**) and downtime (**RTO**), and that backups are actually restorable (verified, not assumed).

---

## 2. Architecture

```
Postgres (HA) → automated encrypted backups + PITR → cross-region copy
Redis (HA)    → cache/queue (rebuildable; queue durable via AOF)
KMS keys      → backed up separately (backups hold ciphertext only)
IaC (Terraform) → rebuild any environment from code
```

GitHub is the **system of record for code** — synced solutions are re-derivable, reducing DR scope for the `problems` data.

---

## 3. Best Practices

- **Automated, encrypted backups** + **PITR** on Postgres.
- **Backups hold ciphertext only**; encryption keys stored separately in KMS.
- **Restore drills** quarterly — a backup you haven't restored is not a backup.
- **IaC** so infrastructure is reproducible, not hand-built.
- **Targets defined**: RPO ≤ 15 min, RTO ≤ 1 hr.

---

## 4. Threats / Scenarios

Accidental data deletion · corrupt migration on the token store · region/AZ outage · ransomware/tampering · KMS key loss · backup that won't restore · token-store breach (treat all tokens compromised).

---

## 5. Prevention / Recovery Techniques

| Scenario | Response |
|----------|----------|
| Data deletion | PITR to just before the event |
| Bad migration | pre-migration backup → restore; expand→contract prevents destructive single steps |
| Region outage | failover to standby region (multi-AZ HA + cross-region backup) |
| Ransomware/tamper | restore from clean immutable backup; rotate creds |
| KMS key loss | keys backed up separately; documented recovery; `keyVersion` for rotation |
| Unrestorable backup | quarterly restore drills + checksum verification |
| Token-store breach | pause sync (kill switch) → rotate KMS → invalidate sessions → notify users to re-authorize (see [SECURITY_PLAN](SECURITY_PLAN.md) §20.5) |

---

## 6. Implementation Guidelines

- Schedule daily full + continuous WAL (PITR); copy to a second region.
- Tag backups with schema version; verify restore into a scratch instance + run smoke checks.
- Keep runbooks for the top incidents; rehearse with tabletop exercises.

---

## 7. Folder Structure

```
infra/terraform/        # (future) reproducible environments
docs/postmortems/       # blameless RCAs after incidents
docs/runbooks/          # (future) per-scenario recovery steps
```

---

## 8. Recommended Tools

Managed Postgres PITR (Neon/Supabase/RDS), cross-region object storage for backups, Terraform, KMS, a status page (Instatus/Statuspage), PagerDuty.

---

## 9. Configuration Examples

```
RPO target: ≤ 15 minutes      # max acceptable data loss
RTO target: ≤ 1 hour          # max acceptable downtime
Backup: daily full + continuous WAL (PITR); 30-day retention; cross-region copy
Restore drill: quarterly into isolated instance + checksum + smoke test
```

---

## 10. Production Considerations

- Document **failover** steps and DNS/Cloudflare cutover.
- **Incident response**: detect → contain (kill switch `SYNC_ENABLED=false`) → eradicate → notify (GDPR 72h if PII) → recover → postmortem.
- Verify the runbook owners + on-call coverage.

---

## 11. Future Improvements

- Automated, continuously-verified restores.
- Multi-region active-passive with automated failover.
- Game-day chaos exercises.

---

## 12. Checklist

- [ ] Automated encrypted backups + PITR
- [ ] Cross-region backup copies
- [ ] Backups = ciphertext only; keys separate in KMS
- [ ] Quarterly restore drills + checksum verification
- [ ] RPO ≤ 15 min, RTO ≤ 1 hr documented
- [ ] Failover + DNS cutover runbook
- [ ] Incident response + kill switch tested
- [ ] Postmortem process + status page

---

## 13. References

- [DATABASE_SECURITY.md](DATABASE_SECURITY.md) · [INFRASTRUCTURE_SECURITY.md](INFRASTRUCTURE_SECURITY.md) · [MONITORING.md](MONITORING.md) · [SECURITY_PLAN.md](SECURITY_PLAN.md) §20.5
- DEVOPS_PLAN §6 (DR) · OBSERVABILITY_PLAN §6 (Incident Response)
