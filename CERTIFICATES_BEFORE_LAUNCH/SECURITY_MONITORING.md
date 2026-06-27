# 📡 Security Monitoring

> Detecting attacks + anomalies in real time: the security-focused slice of CodeVault's observability.

| Field | Detail |
|-------|--------|
| **Overview** | Metrics, alerts, and dashboards focused on security signals. |
| **Purpose** | Catch credential stuffing, IDOR scans, token-decrypt failures, and abuse early. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Token-handling apps are targets; detection enables fast response. |
| **Legally required?** | Indirectly. |
| **Technically required?** | Operationally yes. |
| **When to implement** | Before / shortly after launch. |
| **Priority** | 🟠 High |
| **Estimated Cost** | $0–$ (Sentry/Grafana/Datadog tiers). |
| **Renewal** | Tune alerts continuously. |
| **Official Website** | Prometheus/Grafana/Sentry docs. |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Emit security metrics: `auth_failures_total`, `token_decrypt_total{result}`, 403 rate, rate-limit hits.
2. Define alerts (page vs warn) — see [../docs/MONITORING.md](../docs/MONITORING.md) §5.
3. Build a **Security dashboard**; wire PagerDuty/Slack.

## Required Documents
- Alert catalog; on-call roster.

## Implementation Guide
- Page on: 5xx>5%, auth-fail>10%, **token-decrypt failures>3/5min**, 403 scan, queue stalls.
- Cloudflare WAF/bot event monitoring at the edge.

## Best Practices
- Actionable, tiered alerts; reduce noise; correlate with `requestId`.

## Common Mistakes
- Alert fatigue; no security-specific signals; ignoring decrypt failures.

## CodeVault-specific Notes
- Token-decrypt failure is a **security event** (KMS/tamper) — treat as Sev1.
- Pairs with [LOGGING_POLICY](LOGGING_POLICY.md) + [INCIDENT_RESPONSE_PLAN](INCIDENT_RESPONSE_PLAN.md).

## Future Considerations
- SIEM + anomaly detection; user-facing security alerts.

## Checklist
- [ ] Security metrics emitted
- [ ] Tiered alerts (page/warn) configured + tested
- [ ] Security dashboard live
- [ ] Edge (WAF/bot) monitoring
- [ ] On-call wired

## References
- [LOGGING_POLICY.md](LOGGING_POLICY.md) · [INCIDENT_RESPONSE_PLAN.md](INCIDENT_RESPONSE_PLAN.md) · [../docs/MONITORING.md](../docs/MONITORING.md)
