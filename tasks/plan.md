# Implementation Plan: Kafipos Auth and Multi-Tenancy

Status: Draft — requires human approval before `/build`.

## Architecture decisions

- Use the existing Prisma PostgreSQL schema and shared database with explicit
  `tenant_id` columns.
- Preserve legacy POS username authentication during migration; add merchant
  email authentication without silently changing existing clients.
- Resolve tenant context in middleware, then pass an explicit typed context to
  repositories. Missing context is an error.
- Keep token material hashed and secrets in environment variables.
- Use Redis/Upstash for distributed rate limiting; no production memory
  fallback.
- Use Vitest for unit and Route Handler integration tests, with an isolated
  PostgreSQL test database for database isolation tests.

## Ordered tasks and dependencies

### Phase 1 — Foundation

1. **Add test infrastructure and baseline checks**
   - Acceptance: Vitest can run unit tests and a Route Handler integration
     harness exists; baseline type-check/build commands are documented.
   - Verify: focused Vitest run, `npx tsc --noEmit`, `npm run build`.
   - Dependencies: none.
   - Likely files: `package.json`, `vitest.config.ts`, `tests/**`.

2. **Add tenant and owner schema**
   - Acceptance: Prisma models/enums/indexes/FKs match S1; additive migration
     preserves existing user data; migration status is clean.
   - Verify: Prisma generate, migration apply in test DB, rollback/disaster
     rehearsal documented, schema integration tests.
   - Dependencies: 1.
   - Likely files: `prisma/schema.prisma`, `prisma/migrations/**`, tests.

3. **Add centralized slug policy**
   - Acceptance: S2/S3 helpers pass boundary, reserved-word, Unicode, and
     collision tests.
   - Verify: focused Vitest unit tests.
   - Dependencies: 2.
   - Likely files: `src/lib/tenant-slug.ts`, `src/lib/tenant-reserved.ts`,
     tests.

### Checkpoint: foundation

- Schema migration applies cleanly in an isolated database.
- Unit/integration tests pass.
- No secrets or suppression comments are introduced.
- Human approval is required before proceeding if schema decisions differ from
  the approved spec.

### Phase 2 — Tenant context and isolation

4. **Implement path tenant resolver**
   - Acceptance: S4 route extraction, reserved-route bypass, active lookup,
     404 behavior, and typed context are covered.
   - Verify: middleware/Route Handler integration tests.
   - Dependencies: 2, 3.
   - Likely files: `src/middleware.ts`, `src/lib/tenant-context.ts`, tests.

5. **Add tenant IDs to tenant-owned business tables**
   - Acceptance: existing data has a documented backfill mapping; all
     tenant-owned tables have non-null tenant scope and indexes.
   - Verify: migration against a copy of existing data, Prisma schema check,
     query plan/query-count measurements.
   - Dependencies: 2, 4.
   - Likely files: `prisma/schema.prisma`, migrations, seed/backfill scripts.

6. **Implement tenant-scoped repositories**
   - Acceptance: request-layer access requires context; tenant A cannot read or
     mutate tenant B; missing context fails explicitly.
   - Verify: real Prisma integration tests for read/update/delete and
     transaction paths.
   - Dependencies: 4, 5.
   - Likely files: `src/lib/tenant-repositories/**`, migrated API routes, tests.

### Checkpoint: isolation

- Cross-tenant tests pass for every migrated repository.
- Endpoint query counts and p95 latency are recorded before optimization.
- Security review specifically checks IDOR and unscoped Prisma access.

### Phase 3 — Merchant auth

7. **Add token and verification persistence**
   - Acceptance: hashed single-use 24-hour tokens, used/expired/revoked
     states, and indexes exist.
   - Verify: unit tests for token lifecycle and migration integration tests.
   - Dependencies: 2.
   - Likely files: Prisma schema/migration, `src/lib/verification-token.ts`,
     tests.

8. **Implement registration transaction**
   - Acceptance: S6 endpoint validates input, creates Tenant + OWNER atomically,
     hashes password, returns `201` safe payload, and rolls back on failure.
   - Verify: Route Handler integration tests including forced transaction
     failure and duplicate conflicts.
   - Dependencies: 3, 6, 7.
   - Likely files: `src/app/api/auth/register/route.ts`, validation/service
     modules, tests.

9. **Implement Gmail verification delivery and verify endpoint**
   - Acceptance: service-account adapter sends no secret to client; S7 error
     codes and token state transitions work.
   - Verify: Gmail adapter contract test with a fake transport plus endpoint
     integration tests.
   - Dependencies: 7, 8.
   - Likely files: `src/lib/email/**`, verify route, env config, tests.

10. **Implement resend verification**
    - Acceptance: S8 revokes old tokens, enforces 3/hour, and returns
      `Retry-After`/`retry_after`.
    - Verify: integration test with deterministic rate-limit fake.
    - Dependencies: 7, 9, 12.
    - Likely files: resend route, token service, tests.

11. **Implement merchant email login/session**
    - Acceptance: S9 generic invalid-credential response, 403 unverified
      response, secure cookie, tenant context, and legacy login compatibility.
    - Verify: endpoint integration tests and cookie attribute assertions.
    - Dependencies: 2, 6, 7.
    - Likely files: auth service, login route, session types, tests.

### Phase 4 — Abuse controls

12. **Implement Upstash rate-limit adapter**
    - Acceptance: S10 endpoint policies, combined keys, retry metadata,
      fail-closed behavior, and env validation are covered.
    - Verify: adapter contract tests and endpoint integration tests with a fake
      Redis implementation; live smoke test only in configured environments.
    - Dependencies: 8, 9, 10, 11.
    - Likely files: `src/lib/rate-limit/**`, env config, routes, tests.

### Checkpoint: complete

- All S1–S10 acceptance criteria and tests pass.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, and security audit pass
  at the agreed thresholds.
- Review, simplification, web performance measurements, migration rollback
  rehearsal, and deploy checklist are complete.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Existing `User` model conflicts with owner auth | High | Additive migration and explicit compatibility task |
| Existing `/{tableId}` route conflicts with tenant slug | High | Approve route shape before S4 implementation |
| Backfill cannot infer tenant ownership | High | Stop migration and require an explicit mapping before non-null constraint |
| Gmail/Upstash credentials unavailable locally | Medium | Contract fakes for tests; fail closed in production |
| `next-pwa` transitive audit findings | Medium | Track as dependency exception; do not force major upgrade during auth work |

## Open questions

See the specification's open questions. No implementation task should proceed
past the affected boundary until those questions are approved.

