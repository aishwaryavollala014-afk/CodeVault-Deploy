# 📝 Logging Policy

> What CodeVault logs, what it must never log, and how long logs are kept. Implemented via pino with redaction.

| Field | Detail |
|-------|--------|
| **Overview** | Standards for structured logging, redaction, retention, and access. |
| **Purpose** | Debuggability + security forensics without leaking secrets/PII. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Logs are both a forensic asset and a leakage risk (tokens/PII). |
| **Legally required?** | Indirectly (audit trail; some standards require it). |
| **Technically required?** | Operationally yes. |
| **When to implement** | Before launch (implemented). |
| **Priority** | 🟠 High |
| **Estimated Cost** | $0–$ (log sink). |
| **Renewal** | Review retention/redaction periodically. |
| **Official Website** | https://owasp.org (Logging Cheat Sheet) |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Structured JSON logs (pino) with `requestId`/`jobId`/`userId`/`action`.
2. **Redact** `authorization`, `cookie`, `*.token`, `*.code`, PII (implemented in `lib/logger.ts`).
3. Ship to an encrypted sink; set retention (app 30d, auth 90d, audit 1yr).

## Required Documents
- Log schema; retention matrix.

## Implementation Guide
- Never log secrets/decrypted tokens/source code; correlation ids everywhere.
- Append-only `audit_logs` for security events.

## Best Practices
- Redaction by default; least-access to logs; tamper-evident audit trail.

## Common Mistakes
- Logging tokens/PII; no correlation ids; unbounded retention.

## CodeVault-specific Notes
- Redaction already configured in both services; `git-service` never logs decrypted tokens.

## Future Considerations
- SIEM ingestion; anomaly detection; log-based alerts.

## Checklist
- [ ] Structured JSON + redaction (done)
- [ ] requestId/jobId correlation
- [ ] Retention matrix enforced
- [ ] Audit log append-only
- [ ] Encrypted sink + least-access

## References
- [SECURITY_MONITORING.md](SECURITY_MONITORING.md) · [DATA_RETENTION_POLICY.md](DATA_RETENTION_POLICY.md) · [../docs/MONITORING.md](../docs/MONITORING.md)
- OWASP Logging Cheat Sheet
