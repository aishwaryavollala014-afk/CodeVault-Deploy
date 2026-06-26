# 🔧 CodeVault — DevSecOps

> Securing CodeVault's software delivery: CI/CD on GitHub Actions, dependency + secret scanning, static/dynamic analysis, and artifact integrity. Companion to [DEVOPS_PLAN](DEVOPS_PLAN.md) (§4 pipelines), [INFRASTRUCTURE_SECURITY](INFRASTRUCTURE_SECURITY.md), and [SECRETS](SECRETS.md).

---

## 1. Purpose

Shift security left: catch vulnerabilities, leaked secrets, and supply-chain risks **before** merge to `main`, and deploy only signed, scanned, reproducible artifacts.

---

## 2. Architecture

```
PR → GitHub Actions:
  lint → typecheck → unit/integration (ephemeral DB) → contract tests
  → SAST (CodeQL/Semgrep) → SCA (Dependabot/npm audit) → secret scan (gitleaks)
  → build immutable image → (main) deploy staging → smoke → prod (gated)
```

Path-filtered per service (`web-frontend/`, `web-backend/`, `git-service/`).

---

## 3. Best Practices

- **Branch protection** on `main`: required PR + review + green checks; no force-push.
- **Required checks**: lint, typecheck, tests, coverage, SCA, secret scan, SAST.
- **Deterministic installs** (`npm ci`, committed lockfiles).
- **Least-privilege CI** (OIDC to cloud, no long-lived keys); separate build vs deploy roles.
- **Immutable, versioned artifacts**; deploy by digest.

---

## 4. Threats

Leaked secrets in commits/CI logs · vulnerable dependencies · **dependency confusion / typosquatting** · malicious transitive packages · compromised CI runner exfiltrating secrets · unsigned/unverified artifacts · supply-chain (compromised action).

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| Secret leakage | `gitleaks` in CI + pre-commit; secret manager; masked CI secrets |
| Vuln deps | Dependabot/Renovate; block HIGH+ CVEs; pin versions |
| Dependency confusion | scoped packages; lockfile integrity; private registry config |
| Malicious deps | minimize deps; review high-risk (crypto/http/auth) transitives; `npm audit signatures` |
| CI compromise | pin third-party actions by SHA; least-privilege tokens; ephemeral runners |
| Unverified artifacts | build provenance/signing (Sigstore/cosign); verify before deploy |

---

## 6. Implementation Guidelines

- Pin GitHub Actions to commit SHAs, not tags.
- Run CodeQL on JS/TS; Semgrep rules for Express/Prisma misuse (`queryRawUnsafe`, missing auth).
- Fail the build on HIGH+ SCA findings; auto-PR patch bumps via Dependabot.
- Generate an **SBOM** per build; sign images with cosign.

---

## 7. Folder Structure

```
.github/workflows/
├── frontend.yml        # build, lint, a11y, Lighthouse, deploy
├── backend.yml         # lint, typecheck, test (ephemeral DB), contract, SAST/SCA
├── migrations.yml      # shadow-DB validate → staging → prod (gated)
└── iac.yml             # terraform fmt/validate/plan + tfsec
```

---

## 8. Recommended Tools

GitHub Actions, CodeQL, Semgrep, Dependabot/Renovate, gitleaks, `trivy`/`tfsec`, cosign/Sigstore, `npm ci` + lockfiles.

---

## 9. Configuration Examples

```yaml
# branch protection (conceptual)
required_status_checks: [lint, typecheck, test, sca, secret-scan, codeql]
required_pull_request_reviews: 1
# action pinned by SHA
uses: actions/checkout@<full-sha>
```

---

## 10. Production Considerations

- Environment approvals for prod; migration jobs take a **pre-migration backup**.
- DAST (OWASP ZAP) smoke against staging post-deploy.
- Rotate CI/deploy credentials; audit workflow changes.
- Keep `main` always deployable; feature-flag incomplete work.

---

## 11. Future Improvements

- Full SLSA provenance + attestations.
- Policy-as-code (OPA) gates in CI.
- Automated container base-image refresh.

---

## 12. Checklist

- [ ] Branch protection + required checks on `main`
- [ ] gitleaks (CI + pre-commit); secrets in manager
- [ ] CodeQL + Semgrep; fail on HIGH findings
- [ ] Dependabot/Renovate; lockfiles + `npm ci`
- [ ] Actions pinned by SHA; OIDC, least-privilege CI
- [ ] SBOM + signed images; verify before deploy
- [ ] Migrations: shadow validate + backup + gated prod
- [ ] DAST smoke on staging

---

## 13. References

- [DEVOPS_PLAN.md](DEVOPS_PLAN.md) · [SECRETS.md](SECRETS.md) · [SECURITY_TESTING.md](SECURITY_TESTING.md) · [INFRASTRUCTURE_SECURITY.md](INFRASTRUCTURE_SECURITY.md)
- GitHub Actions hardening · SLSA framework · OWASP DevSecOps Guideline
