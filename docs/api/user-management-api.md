# User Management API

**Status:** Milestone 1.0.2 callable contract. Local implementation only; this does not imply production deployment or approval for broader account, payment, KYC, or compliance workflows.

All operations are Firebase Functions v2 HTTPS callables. Firebase callable infrastructure validates the Firebase Auth credential and supplies `request.auth`; application code does not manually parse JWTs. The authenticated UID is the only profile key source. Direct client reads and writes to `users/{uid}` are denied by Firestore Rules.

## Profile Schema

The document path is `users/{request.auth.uid}`. It contains only:

| Field | Type | Policy |
|---|---|---|
| `name` | string | Required. Trimmed, non-empty, at most 100 Unicode code points, and no control characters. |
| `email` | stored string; response `string \| null` | Firebase Auth is canonical. A stored snapshot is synchronized only against a currently verified, non-empty Auth email. The response exposes an email only while Firebase Auth confirms it is verified; otherwise it is `null`. Clients cannot supply it. |
| `emailVerified` | response boolean | Derived from the current Firebase Auth record; `true` only when the response email is current and verified. It is not stored or client-editable. |
| `locale` | string | Required. Only `en` or `hi`. |
| `notificationPreferences` | map | Required in stored profiles; exactly `{ campaign_update: boolean }`. Defaults to `false`. This setting is not consent, and no notification is sent by these functions. |
| `createdAt` | Firestore Timestamp | Server-controlled; set once during creation. |
| `updatedAt` | Firestore Timestamp | Server-controlled; set on creation and updates. |

Neither the document nor callable response contains a flat role. Account status, admin roles/claims, PAN, KYC state, balances, donation totals/counts, verification badges, and all unknown fields are prohibited from self-service input. Super Admin claims and Gaushala memberships remain separate authorization sources.

Callable responses serialize timestamps as ISO-8601 strings. `emailVerified` is response metadata derived from Firebase Auth, not a profile field. A legacy stored email is never considered verified based on the stored value alone and is not used for authentication, recovery, notification delivery, or tax-related operations. If a verified Auth email later becomes available, the next get, provisioning retry, or permitted update reconciles the stored snapshot transactionally.

The requirement for a verified email on initial profile creation is the current Milestone 1.0.2 implementation policy. It is not automatically a permanent platform-wide rule; product-owner confirmation is required before applying it to future workflows.

## `provisionMyProfile`

Creates a profile if absent. Repeated and concurrent calls are safe: only the first transaction creates the document; later calls preserve the stored name, locale, and preferences. A verified Firebase Auth email may be synchronized without overwriting user-selected profile fields.

Request:

```json
{
  "name": "Example donor",
  "locale": "en",
  "notificationPreferences": {
    "campaign_update": false
  }
}
```

`notificationPreferences` is optional and defaults to `{ "campaign_update": false }`. Unknown keys, including `uid`, `email`, role, server timestamps, and sensitive fields, are rejected.

Response:

```json
{
  "profile": {
    "name": "Example donor",
    "email": "verified@example.test",
    "emailVerified": true,
    "locale": "en",
    "notificationPreferences": { "campaign_update": false },
    "createdAt": "2026-11-12T00:00:00.000Z",
    "updatedAt": "2026-11-12T00:00:00.000Z"
  },
  "created": true
}
```

For an existing profile, `created` is `false`; its user-selected fields are preserved. Initial creation fails with `failed-precondition` until Firebase Auth has a non-empty verified email. On an existing profile, an unverified or missing Auth email is returned as `email: null` and `emailVerified: false`; the stored value is neither exposed nor overwritten. A currently verified Auth email is the canonical response value and is synchronized to the stored snapshot when different.

## `getMyProfile`

Accepts an empty object only; supplied UID or any other field is rejected.

Request:

```json
{}
```

Response:

```json
{
  "profile": {
    "name": "Example donor",
    "email": "verified@example.test",
    "emailVerified": true,
    "locale": "en",
    "notificationPreferences": { "campaign_update": false },
    "createdAt": "2026-11-12T00:00:00.000Z",
    "updatedAt": "2026-11-12T00:00:00.000Z"
  }
}
```

A missing profile returns `not-found`. The operation cannot select or reveal another user's profile. It fetches the authenticated user's Firebase Auth record and transactionally reconciles a currently verified email. An unverified or missing Auth email is represented as `email: null` and `emailVerified: false`, even if a legacy stored email exists. The other valid profile fields remain available.

## `updateMyProfile`

Accepts one or more user-editable fields. Empty updates and unknown/server-controlled fields are rejected.

Request:

```json
{
  "name": "Updated donor",
  "notificationPreferences": { "campaign_update": true }
}
```

Response is `{ "profile": { ... } }` with the same profile shape as `getMyProfile`. A missing profile returns `not-found`; update does not create one. A verified Firebase Auth email is synchronized from Admin Auth when it differs from the profile snapshot; an unverified or missing Auth email is represented as `email: null` and `emailVerified: false` without blocking valid name, locale, or preference changes or overwriting the stored snapshot. `email` and `emailVerified` are not accepted from request data.

## Validation and Errors

| Callable error code | Meaning |
|---|---|
| `unauthenticated` | Firebase callable auth context is missing or has no UID. |
| `invalid-argument` | Request shape, name, locale, preferences, or field allowlist is invalid. |
| `failed-precondition` | Initial profile provisioning requires a verified email on the Firebase Auth account. |
| `not-found` | The authenticated user's profile does not exist for get/update. |
| `internal` | Unexpected backend failure; internal details are not returned. |

The Admin SDK bypasses Firestore Rules, so each function independently authenticates, derives the UID, validates fields, and accesses only that UID's document. Firebase Admin Auth supplies the canonical email and verification state; a missing Auth user is handled as having no currently verified email. Failures log only a generic event, not email or profile payloads.

## Limitations

These callables do not send FCM/SMS, implement notification consent, account recovery, account deletion, memberships, Super Admin user administration, PAN/KYC, donation/financial workflows, or production auditing. V2.1 account-recovery requirements control future recovery design; knowledge-based authentication using donation history is prohibited.
