# 🧪 CodeVault — Security Testing

> How CodeVault verifies its security controls actually work. Companion to [TESTING_PLAN](TESTING_PLAN.md) (overall QA), [SECURITY_PLAN](SECURITY_PLAN.md) (§18 pentest plan), and [ATTACK_PREVENTION](ATTACK_PREVENTION.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Make security a tested property, not a hope: dedicated suites for BOLA, CSRF, token leakage, SSRF, and XSS that **block merge**, plus load/pentest gates before release.

---

## 2. Architecture (test pyramid, security view)

```
        pentest (pre-launch, manual)
      DAST (OWASP ZAP, staging)
    security suite (Supertest: BOLA/CSRF/SSRF/XSS/leak)
  integration (real ephemeral DB)
unit (crypto, JWT, validators, diff)
```

External platforms (LeetCode/CF/GitHub) are **always mocked** in CI — never called live.

---

## 3. Best Practices

- Security behaviours have **dedicated suites**, not comments.
- DB tests hit a **real ephemeral Postgres** (Testcontainers) — no in-process mocks.
- **Contract tests** assert error codes/shapes (`401/403/400/409/429`).
- Coverage floors weighted by risk: **100%** on crypto, auth, ownership middleware.

---

## 4. Threats Validated

BOLA/IDOR · mass assignment · CSRF · SSRF · stored XSS from platform content · token leakage in logs/responses · rate-limit bypass · auth bypass / token forgery · injection.

---

## 5. Techniques

| Test | What it asserts |
|------|-----------------|
| BOLA scan | User A's token → User B's connection/problem/sync id → `403` (not 200/404) |
| Mass assignment | body with `role/plan/userId` → ignored/`400` |
| CSRF | mutation without `X-CSRF-Token` → `403` |
| SSRF | username `localhost`/`169.254.169.254`/`file://` → `400` |
| Token leak | grep logs/responses for `sessionToken`,`cipher`,`Authorization` → absent |
| XSS | platform title `<script>` → rendered/stored as text, not executed |
| Rate limit | burst → `429` within threshold |
| JWT | forged/expired/`alg=none` → `401` |

> Several of these are already **verified manually** in CodeVault (mass-assignment `400`, SSRF username `400`, protected routes `401`, crypto tamper-detect) — they should be codified as automated suites.

---

## 6. Implementation Guidelines

- Seed an **attacker/victim** user pair; never use real creds.
- Run the security suite on every PR (blocks merge); DAST + load + pentest pre-release on staging.
- Provide a `/test/reset` endpoint available **only** in the test env.

---

## 7. Folder Structure

```
<service>/tests/
├── unit/           # crypto, jwt, validators, sync diff
├── integration/    # connections, sync orchestrator, auth refresh (real DB)
├── security/       # BOLA, CSRF, SSRF, XSS, token-leak (Supertest)
├── factories/      # typed builders (User, Connection, Problem)
└── helpers/        # db seeder, auth helper, test client
```

---

## 8. Recommended Tools

`vitest`/`jest`, `supertest`, `testcontainers` (Postgres/Redis), `msw`/`nock` (mock platforms), OWASP ZAP (DAST), `k6` (load/stress), Playwright (E2E), CodeQL/Semgrep (SAST).

---

## 9. Configuration Examples

```ts
it('rejects BOLA on connections', async () => {
  const res = await request(app)
    .get(`/api/v1/sync/status`)
    .set('Authorization', `Bearer ${attackerToken}`);   // querying victim resources
  expect(res.status).toBe(401); // or 403 for owned-but-foreign object ids
});
```

---

## 10. Production Considerations

- Gate releases on security suite + DAST (no Critical/High) + pentest sign-off.
- Fuzz inputs (validators, sync parsing) to surface edge cases.
- Re-run the threat model per new endpoint (delta review in DoD).

---

## 11. Future Improvements

- Continuous DAST against staging.
- Property-based/fuzz tests for parsers and validators.
- Automated dependency exploit checks.

---

## 12. Checklist

- [ ] Security suite (BOLA/CSRF/SSRF/XSS/leak) blocks merge
- [ ] 100% coverage on crypto/auth/ownership
- [ ] Real ephemeral DB in integration tests; platforms mocked
- [ ] Contract tests assert error codes/shapes
- [ ] DAST (ZAP) clean at Critical/High on staging
- [ ] Load/stress tests meet SLOs
- [ ] Manual pentest on OAuth, BOLA, sync trigger, token store
- [ ] Attacker/victim fixtures; `/test/reset` test-only

---

## 13. References

- [TESTING_PLAN.md](TESTING_PLAN.md) · [SECURITY_PLAN.md](SECURITY_PLAN.md) §18 · [ATTACK_PREVENTION.md](ATTACK_PREVENTION.md) · [DEVSECOPS.md](DEVSECOPS.md)
- OWASP Testing Guide · OWASP ZAP · k6 docs


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [ ] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
