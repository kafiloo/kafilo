# Auth environment

The following server-only variables are required for the merchant auth flows:

```text
DATABASE_URL=
JWT_SECRET=
APP_URL=https://app.kafiloo.com
DEFAULT_TENANT_SLUG=
GMAIL_SERVICE_ACCOUNT_EMAIL=
GMAIL_PRIVATE_KEY=
GMAIL_DELEGATED_USER=
GMAIL_FROM_EMAIL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`GMAIL_PRIVATE_KEY` may contain `\n` escape sequences. The Gmail service account
must have domain-wide delegation for the Gmail send scope and
`GMAIL_DELEGATED_USER` must be an authorized mailbox.

Optional rate-limit overrides are `AUTH_LOGIN_LIMIT`,
`AUTH_REGISTER_LIMIT`, `AUTH_RESEND_LIMIT`, and `AUTH_CHECK_SLUG_LIMIT`.
They default to 10/minute, 5/hour, 3/hour, and 30/minute respectively.

If Upstash is temporarily unavailable or not configured, public auth endpoints
use a process-local fallback limiter so login and registration remain available.
The fallback is not distributed; configure both Upstash variables in production
for consistent limits across instances.
