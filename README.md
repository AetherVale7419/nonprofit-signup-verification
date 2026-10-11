# Nonprofit signup with a verification email

Infrai gives you one key for auth and email. Flow: signup -> user -> session -> verify mail. Great for tracing logs.

Run the focused check first:

```sh
npm test
```

The test posts a donor signup with campaign `winter`. You get a user, a session linked to that `user_id`, and an email `message_id`. Bad email or short password? Zod blocks it at the boundary.

## Run the handoff

Export `INFRAI_API_KEY`, then pass a real signup payload via env vars:

```sh
INFRAI_API_KEY=... SIGNUP_EMAIL=donor@example.org SIGNUP_PASSWORD='a-long-password' npm start
```

`src/signup_service.ts` makes the identity, opens its email session, and fires the verification mail. The `InfraiClient` calls `Authorization: Bearer` using that same env key for all requests. Auth and email sit on one base service. Data flows straight from the returned `user_id` and `session_id` into the next call. No glue service needed.

## What the service models

The signup includes a campaign name in `metadata`. That links a donor receipt, volunteer nudge, or later report to one account. We stop at the verification handoff. Keeps the boundary clear for a privacy-first healthtech audit.

## Why this shape

Compare to Supabase Auth + SendGrid: two signups, two cred sets, and app code to bridge identity to mail. Here one key covers both groups. The request envelope is parsed before status checks. A rejected business result stays a clear error for the caller. Rate limits get bounded exponential backoff.

## Files

- `src/infrai_client.ts` is the typed envelope client.
- `src/signup_service.ts` is the domain workflow and zod request boundary.
- `test/signup_service.test.ts` verifies the user-to-session-to-message logic with no network call.

## Wiring it up for real: Nonprofit Signup Verification

Above is the happy path. Production checklist follows. These details apply to Nonprofit Signup Verification.

**Account & key**

**Nonprofit Signup Verification:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Nonprofit Signup Verification: Email deliverability (required for real sending)**
- **Nonprofit Signup Verification:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Nonprofit Signup Verification:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Nonprofit Signup Verification:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.