# 📘 API Documentation

> Public/developer documentation of CodeVault's REST APIs. The frozen contract already exists; this covers publishing it well.

| Field | Detail |
|-------|--------|
| **Overview** | Human + machine-readable docs for `web-backend` + `git-service` endpoints. |
| **Purpose** | Enable frontend devs, integrators, and (future) public API consumers. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | The FE builds against the contract; future integrations need stable docs. |
| **Legally required?** | No. |
| **Technically required?** | Operationally valuable. |
| **When to implement** | Contract exists; publish before/with launch. |
| **Priority** | 🟢 Medium |
| **Estimated Cost** | $0. |
| **Renewal** | Update with every contract change. |
| **Official Website** | https://www.openapis.org |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Source of truth: [../docs/API_CONTRACT.md](../docs/API_CONTRACT.md) (endpoints, models, errors).
2. Generate an **OpenAPI** spec from Zod schemas; render with Swagger UI/Redoc.
3. Add auth + error-envelope + rate-limit + versioning notes.

## Required Documents
- The API contract.

## Implementation Guide
- Document the shared error envelope, cursor pagination, `/api/v1` versioning, and auth (cookie/Bearer JWT).
- Keep examples per endpoint; mark internal vs public.

## Best Practices
- Contract-first; OpenAPI generated + validated in CI; changelog for breaking changes.

## Common Mistakes
- Docs drifting from code; undocumented error codes; exposing internal endpoints publicly.

## CodeVault-specific Notes
- Contract is frozen in code (`web-backend/src/types/index.ts`); generate OpenAPI from Zod to prevent drift.
- Two base URLs (web-backend + git-service) — document both.

## Future Considerations
- Public developer portal + API keys if a public API is offered.

## Checklist
- [ ] OpenAPI generated from schemas
- [ ] Rendered docs (Swagger/Redoc) published
- [ ] Auth, errors, pagination, versioning documented
- [ ] CI contract-conformance tests
- [ ] Kept in sync with code

## References
- [../docs/API_CONTRACT.md](../docs/API_CONTRACT.md) · [../docs/API_SECURITY.md](../docs/API_SECURITY.md) · [PUBLIC_CHANGELOG.md](PUBLIC_CHANGELOG.md)
- openapis.org
