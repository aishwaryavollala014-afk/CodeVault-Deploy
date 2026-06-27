# 🟢 Status Page

> A public page showing CodeVault's uptime + incidents — builds trust and is the channel for incident comms.

| Field | Detail |
|-------|--------|
| **Overview** | A hosted status page reporting component health (API, Sync, GitHub sync, DB). |
| **Purpose** | Transparent uptime + a single source of truth during incidents. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Users need to know if sync/API is down; required by the incident-comms plan. |
| **Legally required?** | No (SLA-driven for enterprise). |
| **Technically required?** | No. |
| **When to implement** | At / shortly after launch. |
| **Priority** | 🟢 Medium |
| **Estimated Cost** | $0 (Instatus/Betterstack free tiers) → paid at scale. |
| **Renewal** | Subscription if paid. |
| **Official Website** | https://instatus.com · https://betterstack.com |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Choose a provider; define components (API, Sync workers, GitHub sync, Database).
2. Wire synthetic checks on `/health` from multiple regions.
3. Link from the app footer; use it for incident updates.

## Required Documents
- None.

## Implementation Guide
- Automate component status from uptime monitors; manual incident posts for outages.

## Best Practices
- Honest, timely updates; subscribe option; historical uptime visible.

## Common Mistakes
- Stale page; not updating during real incidents.

## CodeVault-specific Notes
- Distinguish **stats (Path A)** vs **sync (Path B)** components — they fail independently.

## Future Considerations
- SLA-backed status for enterprise; webhook-driven auto-incidents.

## Checklist
- [ ] Status page live + linked in footer
- [ ] Components: API/Sync/GitHub/DB
- [ ] Synthetic `/health` checks
- [ ] Used for incident comms

## References
- [INCIDENT_RESPONSE_PLAN.md](INCIDENT_RESPONSE_PLAN.md) · [../docs/OBSERVABILITY_PLAN.md](../docs/OBSERVABILITY_PLAN.md) · [../docs/MONITORING.md](../docs/MONITORING.md)
