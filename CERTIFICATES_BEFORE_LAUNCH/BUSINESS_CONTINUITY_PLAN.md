# 🏢 Business Continuity Plan (BCP)

> Keeping CodeVault (and its operators) functioning through disruptions beyond pure IT disaster — the organizational layer above the DRP.

| Field | Detail |
|-------|--------|
| **Overview** | Plans for sustaining critical functions during disruptions (key-person loss, vendor outage, etc.). |
| **Purpose** | Continuity of service + operations beyond data recovery. |
| **Category** | 🟡 Recommended After Launch |
| **Why it is needed** | A small team has key-person + vendor risks; enterprise buyers ask for a BCP. |
| **Legally required?** | No (expected for enterprise/ISO 22301). |
| **Technically required?** | No (organizational). |
| **When to implement** | After launch; formalize as the team/customers grow. |
| **Priority** | 🟡 Medium |
| **Estimated Cost** | $0 (process). |
| **Renewal** | Annual review + drill. |
| **Official Website** | https://www.iso.org/standard/75106.html (ISO 22301) |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Identify critical functions (auth, sync, data) + dependencies (GitHub, hosting, Cloudflare).
2. Document continuity for key-person loss, vendor outage, payment-processor loss.
3. Link the DRP for IT recovery; define communication + decision authority.

## Required Documents
- BCP doc; contact tree; vendor list.

## Implementation Guide
- Reduce bus-factor: documented runbooks, shared access (no single owner of secrets), vendor alternatives noted.

## Best Practices
- Test annually; keep contacts current; identify single points of failure.

## Common Mistakes
- Confusing BCP with DRP; key-person dependencies; never testing.

## CodeVault-specific Notes
- Today: 2-person team → document access recovery (registrar/Cloudflare/GitHub org) to survive one person being unavailable.

## Future Considerations
- ISO 22301 alignment for enterprise deals.

## Checklist
- [ ] Critical functions + dependencies mapped
- [ ] Key-person + vendor risk addressed
- [ ] Contact tree + decision authority
- [ ] Linked to DRP; tested annually

## References
- [DISASTER_RECOVERY_PLAN.md](DISASTER_RECOVERY_PLAN.md) · [INCIDENT_RESPONSE_PLAN.md](INCIDENT_RESPONSE_PLAN.md)
- ISO 22301
