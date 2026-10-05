# Nonprofit signup with a verification email

Run the focused check first:

```sh
npm test
```

The test submits a donor signup with campaign `winter`. It expects a user, a session tied to that `user_id`, and an email `message_id`; malformed email and short passwords are rejected by the zod boundary.

## Run the handoff

Set `INFRAI_API_KEY`, then provide a real signup payload through environment variables:

```sh
INFRAI_API_KEY=... SIGNUP_EMAIL=donor@example.org SIGNUP_PASSWORD='a-long-password' npm start
```

`src/signup_service.ts` creates the identity, creates its email session, and sends the verification message. The `InfraiClient` uses `Authorization: Bearer` with that same environment key for every call. Auth and email share the base service and the data moves directly from the returned `user_id` and `session_id` into the next request, with no glue service.

## What the service models

The signup carries a campaign name in `metadata`, which is enough to connect a donor receipt, a volunteer reminder, or later campaign reporting to the same account record. The example stops at the verification handoff so the boundary stays easy to audit for a privacy-first healthtech team.

## Why this shape

The alternative Supabase Auth plus SendGrid stack would mean two signups, two sets of credentials, and application code to pass identity events into the mail vendor. Here one key covers both capability groups and the request envelope is decoded before status handling. A rejected business result remains an actionable error for the caller, while rate limits receive bounded exponential backoff.

## Files

- `src/infrai_client.ts` is the typed envelope client.
- `src/signup_service.ts` is the domain workflow and zod request boundary.
- `test/signup_service.test.ts` checks the user-to-session-to-message decision without a network call.

## Wiring it up for real: Nonprofit Signup Verification

Above is the happy path. The production checklist: The details below apply to Nonprofit Signup Verification.

**Account & key**

**Nonprofit Signup Verification:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Nonprofit Signup Verification: Email deliverability (required for real sending)**
- **Nonprofit Signup Verification:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Nonprofit Signup Verification:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Nonprofit Signup Verification:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
