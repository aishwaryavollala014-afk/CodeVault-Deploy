# 🐙 GitHub OAuth Requirements

> CodeVault is GitHub-OAuth-first. A correctly configured GitHub OAuth App (or App) is mandatory for login and the sync token.

| Field | Detail |
|-------|--------|
| **Overview** | Registering CodeVault with GitHub to obtain a Client ID/Secret and authorize users via OAuth. |
| **Purpose** | Passwordless login + a scoped token to push solutions to the user's repo. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | All authentication and the GitHub sync depend on it; there is no password fallback. |
| **Legally required?** | No (it's GitHub's developer terms you must accept). |
| **Technically required?** | **Yes** — core to the product. |
| **When to implement** | Before launch; needed even in dev for end-to-end login. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | $0. |
| **Renewal** | Rotate client secret periodically / on suspicion. |
| **Official Website** | https://github.com/settings/developers |
| **Eligibility** | A GitHub account/org; acceptance of GitHub Developer Terms. |

## Step-by-Step Process
1. GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App.
2. Set Homepage `https://<domain>` and **callback** `https://<domain>/api/v1/auth/github/callback`.
3. Copy Client ID; generate Client Secret; store in the secret manager (see [SECRETS_MANAGEMENT](SECRETS_MANAGEMENT.md)).
4. Request **least scopes**: `read:user user:email repo` (repo for sync push).

## Required Documents
- None; accept GitHub Developer & API Terms.

## Implementation Guide
- Per-environment OAuth Apps (dev/staging/prod) with their own callbacks.
- `state` (anti-CSRF) stored single-use in Redis; redirect-URI allowlisted by GitHub.
- Token encrypted at rest (`oauth_identities`), reused by git-service for pushes.

## Best Practices
- Minimize scope; migrate to a **GitHub App** for fine-grained, per-repo permissions + PKCE + higher rate limits.
- Rotate client secret; never commit it; never expose it to the browser.

## Common Mistakes
- Callback URL mismatch (must equal `GITHUB_CALLBACK_URL` exactly, incl. `/api/v1`).
- Over-broad scope (full `repo` to all repos) — prefer GitHub App per-repo.
- Client secret in the frontend bundle.

## CodeVault-specific Notes
- Verified working in CodeVault's `auth.service.ts`; needs real Client ID/Secret in `web-backend/.env`.
- The encrypted token is decrypted in-memory by git-service to push (see [../docs/GITHUB_SECURITY.md](../docs/GITHUB_SECURITY.md)).

## Future Considerations
- GitHub App migration for least-privilege + webhooks.
- "Sign in with GitHub" review/branding compliance.

## Checklist
- [ ] OAuth App per environment; exact callback URL
- [ ] Least scopes (`read:user user:email repo`)
- [ ] Secret in manager; rotation plan
- [ ] `state` single-use; redirect allowlisted
- [ ] Token encrypted at rest; never in browser

## References
- [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) · [../docs/AUTH_SECURITY.md](../docs/AUTH_SECURITY.md) · [../docs/GITHUB_SECURITY.md](../docs/GITHUB_SECURITY.md)
- GitHub: Authorizing OAuth Apps / Building GitHub Apps
