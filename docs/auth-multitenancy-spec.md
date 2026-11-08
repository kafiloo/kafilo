# Specification: Kafipos Auth and Multi-Tenancy

Status: Draft — requires human approval before `/build`.
Date: 2026-11-09

## Context and detected stack

- Next.js App Router 16, TypeScript, Route Handlers, and middleware.
- Prisma ORM with PostgreSQL/Neon.
- Existing POS authentication uses `users.username`, bcrypt, and an
  `httpOnly` `pos_session` JWT cookie.
- No test runner is currently declared. The plan proposes Vitest for unit and
  Route Handler integration tests.
- The database is shared by tenants. Every tenant-owned record must carry
  `tenant_id` and be accessed through a tenant-scoped data boundary.

## Capability map

| Module | Responsibility | Depends on |
|---|---|---|
| tenant-foundation | Tenant and user identity schema | — |
| slug-policy | Slug validation and generation | tenant-foundation |
| tenant-resolution | Path-to-tenant request context | slug-policy, tenant-foundation |
| tenant-data-boundary | Tenant-scoped repositories and enforcement | tenant-resolution, tenant-foundation |
| merchant-auth | Registration, verification, login, and sessions | tenant-foundation, slug-policy |
| abuse-controls | Redis/Upstash rate limiting | merchant-auth, tenant-resolution |

Build order: tenant-foundation → slug-policy → tenant-resolution →
tenant-data-boundary → merchant-auth → abuse-controls.

## Assumptions and decisions

1. The existing POS `User` table is preserved and migrated additively. Existing
   `name`, `username`, and `password` fields remain temporarily for legacy POS
   compatibility while merchant auth uses `email`, `password_hash`, and
   `email_verified_at`.
2. `OWNER` is added to the existing role enum. Existing POS roles remain valid.
3. New merchant endpoints are additive and do not silently change the legacy
   username login contract.
4. The public tenant route is `/{tenantSlug}/...`; the first segment is never
   interpreted as a tenant when it is a system route or reserved word.
5. Gmail uses a server-side service-account adapter. Credentials are supplied
   through environment variables and never persisted in the repository.
6. Vitest is the proposed test runner because no runner exists in the detected
   project. It will be introduced in the first build slice.
7. Rate-limit keys combine normalized IP and normalized email where an email is
   available. IP-only keys are used for slug checks and requests without email.
   Redis/Upstash is the shared source of truth; no in-memory fallback is allowed
   in production.

## API-wide conventions

### Success and error envelope

Successful responses return JSON specific to the endpoint. Errors return:

```json
{
  "error": {
    "code": "machine_readable_code",
    "message": "Safe human-readable message",
    "details": {}
  }
}
```

`details` is omitted unless the client needs structured validation data.
Authentication and registration errors must not reveal whether an email
exists.

### Validation and security

- JSON bodies are size-limited and validated at the Route Handler boundary.
- Emails are normalized to lowercase and trimmed before lookup or storage.
- Passwords are never logged or returned. Argon2id is preferred; bcrypt remains
  the compatibility fallback only where an existing hash requires it.
- Verification tokens are generated with a cryptographically secure RNG,
  stored only as a hash, are single-use, and expire after 24 hours.
- Cookies are `httpOnly`, `secure`, `sameSite=lax` or stricter, path `/`, and
  have a bounded lifetime.
- Every tenant-scoped query requires an explicit tenant context. Missing
  context is an error, never an empty/default tenant.

## Story S1 — Basic tenant schema

### Goal

Create the shared-database foundation for merchants and owners.

### Input/output

Database migration only. The resulting schema exposes:

- `tenants`: `id`, `name`, `slug`, `status`, `created_at`, `updated_at`.
- `users`: `id`, `tenant_id` FK, `email`, `password_hash`, `role`,
  `email_verified_at`, `created_at`, plus existing compatibility fields until
  their removal is explicitly approved.

`tenants.slug` and `users.email` are globally unique. Tenant status is an
allowlisted enum with at least `ACTIVE` and `SUSPENDED`.

### Error and edge cases

- Duplicate slug/email fails with a typed unique-conflict error.
- Deleting a tenant with users or business data is blocked or handled by an
  explicit migration policy; no cascade deletion is introduced implicitly.
- Down migration must restore the prior schema only in a disposable/local
  database. Production rollback policy is forward-compatible migration, not
  destructive down migration.

### Contract

No public endpoint. Prisma schema and migration are the contract.

## Story S2 — Slug validation and reserved words

### Goal

Prevent invalid or system-conflicting tenant path segments.

### Input/output

`validateTenantSlug(input: string)` returns a normalized valid slug or a
typed validation error. Valid slugs are 3–30 characters, lowercase ASCII
letters/digits/hyphens, and cannot start/end with a hyphen or contain
consecutive separators.

Reserved words are a centralized immutable constant. It includes at least:
`admin`, `api`, `www`, `app`, `auth`, `login`, `register`, `logout`, `cms`,
`cashier`, `_next`, `favicon.ico`, `icons`, `public`, `landingpage`, and all
currently reserved route segments.

### Error and edge cases

- Empty, too short, too long, malformed, and reserved values have distinct
  machine-readable error codes.
- Unicode input is rejected by validation after generator normalization; it is
  not compared with locale-sensitive casing.
- Validation does not query the database; uniqueness is checked separately.

### Contract

Internal pure helper. API consumers receive `slug_invalid`,
`slug_reserved`, or `slug_taken` as appropriate.

## Story S3 — Business-name slug generator

### Goal

Generate a valid URL slug from a business name.

### Input/output

`generateTenantSlug(name, isTaken)`:

1. trims and lowercases;
2. removes accents using Unicode normalization;
3. removes unsupported symbols/emoji;
4. converts whitespace and separator runs to `-`;
5. truncates without leaving a trailing hyphen;
6. validates using S2;
7. appends `-2`, `-3`, ... until `isTaken` is false.

The result is always a slug accepted by S2 or a typed `slug_unavailable` error
when the suffix space is exhausted.

### Edge cases

- Names containing no usable characters fail explicitly.
- Names that differ only by accents normalize to the same candidate.
- The uniqueness callback is bounded and deterministic; it cannot loop forever.

### Contract

Internal helper used by registration and slug availability checks.

## Story S4 — Path-based tenant resolver

### Goal

Resolve the first path segment to a tenant context.

### Input/output

For `app.kafiloo.com/{tenantSlug}/...`, middleware extracts the first segment,
looks up an active tenant, and attaches `{ tenantId, tenantSlug }` to the
request context consumed by Route Handlers.

Unknown or inactive tenants return a generic 404 JSON/page response according
to the request type. System/reserved segments bypass tenant resolution and
retain their existing route behavior.

### Edge cases

- URL decoding and repeated slashes are normalized before resolution.
- A reserved route is never queried as a tenant.
- Suspended tenants cannot access tenant routes.
- Resolver failures do not default to another tenant.

### Contract

Internal request-context contract:

```ts
type TenantContext = { tenantId: string; slug: string };
```

## Story S5 — Tenant-scoped repository boundary

### Goal

Make cross-tenant reads and writes structurally difficult and observable.

### Input/output

Tenant-owned repositories accept `TenantContext` from the request context and
inject `tenant_id` into every read, update, delete, and relation lookup.
Calling a repository without tenant context throws a typed
`tenant_context_required` error.

Existing tenant-owned business tables are migrated to include `tenant_id`,
with indexes and foreign keys as appropriate. Cross-tenant IDs supplied by a
client behave as not-found, not as authorization success.

### Edge cases

- Tenant A cannot read, update, or delete Tenant B records.
- `findUnique` helpers must include tenant scope or use a scoped repository
  method; unscoped Prisma access is prohibited in request code.
- Transactions preserve tenant scope for every operation.

### Contract

Repository methods are the only permitted request-layer data access for
tenant-owned entities. Integration tests must prove isolation for reads and
writes.

## Story S6 — Merchant registration

### Goal

Create a tenant and owner atomically and start verification.

### Endpoint

`POST /api/auth/register`

Request:

```json
{
  "email": "owner@example.com",
  "password": "strong-password",
  "business_name": "Kafilo Coffee",
  "slug": "kafilo-coffee"
}
```

`slug` may be omitted only if the product explicitly chooses automatic
generation; this draft keeps it required to match the stated input contract.

Response `201`:

```json
{ "tenant": { "id": "…", "name": "Kafilo Coffee", "slug": "kafilo-coffee" } }
```

No password, token, or internal user fields are returned.

### Errors and edge cases

- Invalid input: `400`/`422` with field details.
- Existing email or slug: conflict response without leaking unrelated account
  details.
- Database or mail failure: transaction is rolled back; response is generic
  `500`/`503`.
- Owner creation and tenant creation occur in one database transaction.
- Email dispatch uses an outbox/transaction-safe boundary so a committed
  account cannot silently lose its verification message.

## Story S7 — Email verification

### Goal

Verify ownership of the owner email through Gmail API.

### Endpoint

`POST /api/auth/verify-email`

Request:

```json
{ "token": "opaque-token" }
```

Success `200`:

```json
{ "verified": true }
```

Token records store only a hash, expiry, usage/revocation state, and owner
reference. Token validity is 24 hours and single-use.

Errors: `token_invalid`, `token_expired`, and `token_used`, each with safe
client messaging and a non-success status.

## Story S8 — Resend verification

### Goal

Issue a new verification token safely.

### Endpoint

`POST /api/auth/resend-verification`

Request:

```json
{ "email": "owner@example.com" }
```

Success is intentionally generic so it does not disclose account state.
At most three requests per hour per normalized email are accepted. Creating a
new token revokes prior active tokens.

Limit response: `429`, `Retry-After: <seconds>`, and:

```json
{ "error": { "code": "rate_limited", "retry_after": 123 } }
```

## Story S9 — Merchant login and session

### Goal

Authenticate an owner and establish a secure session.

### Endpoint

`POST /api/auth/login`

Request:

```json
{ "email": "owner@example.com", "password": "strong-password" }
```

Success `200` sets a secure `httpOnly` session cookie and returns only safe
tenant/user identity:

```json
{
  "user": { "id": "…", "email": "owner@example.com", "role": "OWNER" },
  "tenant": { "id": "…", "slug": "kafilo-coffee" }
}
```

Unverified accounts return `403 email_not_verified`. Invalid email/password
always uses the same generic response and timing-resistant verification path.
Existing username POS login must remain compatible until an explicit
migration task removes it.

## Story S10 — Redis/Upstash rate limiting

### Goal

Protect public auth and slug endpoints from brute force and abuse.

### Protected endpoints and default limits

| Endpoint | Key | Default |
|---|---|---|
| register | IP + normalized email | 5/hour |
| login | IP + normalized email | 10/15 minutes |
| resend-verification | IP + normalized email | 3/hour |
| slug availability/check | IP | 30/minute |

Limits are configuration values from environment-backed server config.
Redis/Upstash is mandatory in production. Every `429` includes `retry_after`
and `Retry-After`. Redis failures fail closed for auth-sensitive endpoints and
emit structured security logs; no silent in-memory fallback is permitted.

## Testing strategy

- Unit tests: slug validation/generation, error mapping, token hashing,
  rate-limit key construction.
- Route Handler integration tests: register transaction/rollback, verify
  token states, resend limits, login cookie/error behavior, and 404 tenant
  resolution.
- Database integration tests use an isolated PostgreSQL test database and real
  Prisma queries where tenant isolation is under test.
- Every story has tests before implementation is considered complete.

## Open questions requiring approval

1. The existing route shape is currently `/{tableId}/...`; adopting
   `/{tenantSlug}/...` requires deciding whether customer routes become
   `/{tenantSlug}/{tableId}/...` or retain a compatibility route.
2. The draft keeps legacy POS auth fields and endpoints. Confirm that additive
   migration is preferred over replacing the existing POS login.
3. Confirm the Gmail service-account deployment model and required environment
   variable names.
4. Confirm whether registration requires explicit `slug` or may auto-generate
   from `business_name`.

