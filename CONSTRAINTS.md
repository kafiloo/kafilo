# Kafipos Engineering Constraints

Status: Draft — review with the auth/multi-tenancy specification.
Last reviewed: 2026-11-09

## Floor (always enforced)

- No secrets, tokens, passwords, or private keys in source or committed
  environment files.
- Auth delivery requires the documented Gmail and Upstash server-only
  environment variables; missing configuration must return an explicit error.
- No new `@ts-ignore`, `@ts-nocheck`, `eslint-disable`, or equivalent
  suppression without an approved exception.
- No skipped/deleted tests without a reason recorded in the change summary.
- No silent fallback when tenant context, authentication, authorization, Redis,
  or required environment configuration is missing.
- No unparameterized SQL, shell construction from request input, or raw HTML
  from untrusted input.
- Tenant-owned request data access must not call Prisma without an explicit
  tenant context.

## Enforced checks

| Dimension | Rule | Checked by | Runs at |
|---|---|---|---|
| Types | Zero TypeScript errors | `npx tsc --noEmit` | Every slice |
| Lint | Zero new lint errors from project config | `npm run lint` | Every slice |
| Build | Production build succeeds | `npm run build` | Slice end and ship |
| Dependencies | Zero high/critical production advisories | `npm audit --omit=dev --audit-level=high` | Slice end and ship |
| Tenant isolation | Cross-tenant read/write tests pass | Vitest integration suite | Every repository slice |
| Auth security | Generic credential errors; secure cookie assertions | Vitest integration suite | Every auth slice |
| Performance | Record p95 latency and DB query count before optimization | Route benchmark/instrumentation | Endpoint slice |

## Proposed checks after test infrastructure exists

- Changed-line coverage target: 80% for new auth/tenant code. This is not
  enforced until Vitest coverage is installed and the baseline is measured.
- Performance budgets will be established from measurements in `/webperf`; no
  invented latency target will block the first measurement.
- At least one external dependency audit remains mandatory; current residual
  low-severity `next-pwa` findings require a separately approved upgrade.

## Current baseline exceptions

| ID | Constraint | Scope | Reason | Owner | Expires |
|---|---|---|---|---|---|
| B1 | Zero lint errors | Existing `src/**` | Baseline currently contains pre-existing lint errors; new auth slices must not add errors | @karsstr | 2027-02-07 |

Exceptions do not permit weakening rules in new or touched auth/multi-tenant
code. They must be removed or renewed explicitly at expiry.

## Security and data boundaries

- `tenant_id` is required and non-null for tenant-owned records after the
  migration/backfill checkpoint.
- Repository methods receive `TenantContext`; missing context throws
  `tenant_context_required`.
- Password hashes, verification token hashes, session secrets, Gmail
  credentials, and Redis credentials never appear in JSON responses or logs.
- Logs use structured fields: `event`, `request_id`, `tenant_id` when known,
  `user_id` when known, `result`, and `error_code`; never raw secrets or
  passwords.
- API errors use `{ error: { code, message, details? } }`; internal exception
  details are server-only.

## Required verification commands

```text
npx tsc --noEmit
npm run lint
npm audit --omit=dev --audit-level=high
npm run build
```

After Task 1, add the repository's focused Vitest commands here and to
`package.json`. Do not claim coverage or performance enforcement until the
commands produce a measurable verdict.

Current test commands:

```text
npm test
npm run test:watch
```
