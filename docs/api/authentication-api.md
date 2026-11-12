# Authentication and Health API

**Status:** Documents `healthCheck` and `getMyAuthContext`, the two functions relevant to this authentication/health contract. The backend currently exports five functions in total; this is a limited foundation, not a complete application API.

The local Functions emulator uses the configured demo project and default `us-central1` region. Do not infer a production region or deployed endpoint from the emulator URL.

## `healthCheck`

| Property | Contract |
|---|---|
| Trigger | Firebase Functions v2 HTTP `onRequest` |
| Authentication | Public; no Firebase Auth token is required or checked |
| Input | HTTP request; request body is ignored |
| Allowed method | `GET` |

Successful response (`200 OK`):

```json
{ "status": "ok" }
```

Unsupported methods return `405 Method Not Allowed`, the response header `Allow: GET`, and:

```json
{ "status": "method_not_allowed" }
```

The handler does not expose dependency, Firestore, payment-provider, or other service health.

## `getMyAuthContext`

| Property | Contract |
|---|---|
| Trigger | Firebase Functions v2 HTTPS callable `onCall` |
| Authentication | Requires Firebase callable `request.auth` with a non-empty UID |
| Input | No input data is required; any supplied callable data is ignored |
| Identity source | `request.auth.uid`, never a client-provided UID |

Firebase callable infrastructure validates the Firebase Auth credential and supplies `request.auth`. The function does **not** manually parse or verify JWTs.

The callable result has this shape:

```json
{
  "uid": "firebase-auth-uid",
  "emailVerified": true,
  "phoneVerified": true,
  "superAdmin": false
}
```

Field derivation in the current implementation:

- `uid`: authenticated `request.auth.uid`.
- `emailVerified`: `request.auth.token.email_verified === true`.
- `phoneVerified`: true only when `request.auth.token.phone_number` is a non-empty string. The implementation checks claim presence, not a separate `phone_number_verified` field.
- `superAdmin`: `request.auth.token.superAdmin === true`. This reports the claim only; it is not proof of active Super Admin authorization.

Missing authentication context or UID throws Firebase `HttpsError` with code `unauthenticated` and message `Authentication is required.` Firebase serializes this using the callable error protocol. Callable clients should handle it as an unauthenticated callable error; raw HTTP error envelopes are managed by Firebase.

`requireActiveSuperAdmin()` is an asynchronous reusable guard for future trusted callable handlers. It requires the exact boolean claim and a valid, enabled `super_admin_access/{uid}` state document; missing, malformed, disabled, or inaccessible state returns a generic `permission-denied`. It uses Firebase's verified callable `request.auth` context and does not manually parse JWTs. No exported administrative function currently uses this guard, and this document does not define a claim-assignment API.

For Firestore Rules access restricted to Super Admins, both the exact claim and enabled server-managed state are required on each request. Client SDK reads and writes to the state collection are denied. See [ADR 002](../adr/002-super-admin-immediate-revocation.md).

## Emulator URLs

With the configured local demo project, Firebase Functions v2 emulator routes are:

```text
GET  http://127.0.0.1:5001/demo-gau-sevak/us-central1/healthCheck
POST http://127.0.0.1:5001/demo-gau-sevak/us-central1/getMyAuthContext
```

Call the callable through the Firebase Functions client SDK when possible so the SDK applies the callable request/response protocol. These URLs are emulator-only examples, not deployed service addresses.

## Scope Limits

There are no protected HTTP endpoints in the current exports. The public health endpoint does not perform authorization. The callable exposes only the caller's own basic auth context; it does not fetch or update an application profile, assign claims, check Gaushala membership, or authorize business operations.
