# Backend Architecture

**Status:** Limited local Firebase Functions foundation with authenticated user-profile management. Donation/payment and other future workflows, cloud deployment, and production operations are not implemented. Apply V2.1 to conflicts with V2.0; retain non-conflicting V2.0 scope without treating requirements as implementation evidence.

## Runtime and Build

- Firebase Functions v2 with TypeScript and Node.js 22.
- `firebase.json` selects the `backend/functions` source and `nodejs22` runtime.
- The package uses strict TypeScript, `NodeNext` module resolution, ES2022 output, declarations, and source maps. `tsconfig.json` compiles `src/**/*.ts` to `lib/`.
- `backend/functions/package.json` points `main` to `lib/index.js`. Run `npm --prefix backend/functions run build` to generate that entry point and the other output files.
- The package also provides `typecheck`, `lint`, `test`, and `test:emulator` scripts. See [Backend Test Plan](../testing/backend-test-plan.md).

## Source Layout

```text
backend/functions/src/
  config/firebase-admin.ts       Shared Firebase Admin initialization
  core/
    auth/auth-guard.ts           Authentication and Super Admin guards
    errors/app-errors.ts         AppError and callable error mapping
    logging/logger.ts            Firebase logger wrappers
    validation/                  Reserved shared-validation space; no core utility yet
  modules/
    account/account-context.functions.ts
    health/health.functions.ts
    users/user-profile.functions.ts
    users/user-profile.service.ts
    users/user-profile.validation.ts
  other domain folders           Placeholders; no additional workflows implemented
```

The remaining domain folders are placeholders, not implemented modules. Current function exports are re-exported from `src/index.ts`.

## Firebase Admin Clients

`src/config/firebase-admin.ts` finds the existing default Admin app or initializes it if absent, then exports reusable Firebase Admin `auth` and Firestore `db` clients. This module does not initialize multiple default apps. The account-context handler uses the authenticated callable context; user-profile handlers use the Admin Auth and Firestore clients. Emulator tests also use Admin Auth to manage synthetic users.

## Authentication and Authorization

`src/core/auth/auth-guard.ts` defines:

- `requireAuthenticatedUser(request)`: requires a non-empty UID in the callable request's Firebase-provided `request.auth` context, otherwise throws `HttpsError('unauthenticated', ...)`.
- `requireActiveSuperAdmin(request)`: asynchronously requires authenticated callable context, the exact `superAdmin === true` claim, and a valid enabled `super_admin_access/{uid}` state document. Missing, malformed, disabled, or inaccessible state throws a generic `permission-denied`.

Firebase callable infrastructure validates the Firebase Auth credential and supplies `request.auth`; application code does not manually decode or verify JWTs. `getMyAuthContext` reports the verified claim but does not authorize privileged operations. `requireActiveSuperAdmin` is reusable but is not connected to an exported administrative function. No Gaushala membership, tenant authorization, claim-assignment lifecycle, or business authorization endpoint exists.

Super Admin authorization requires both the exact token claim and the server-managed state document. The state collection is client-inaccessible. Each guarded backend operation performs an Admin SDK read and each Super Admin Rules check performs a state lookup; neither uses cross-request authorization caching. See [ADR 002](../adr/002-super-admin-immediate-revocation.md).

Direct client Firestore and Storage access is governed by their security rules. Trusted backend use of the Firebase Admin SDK bypasses those rules and must receive explicit server-side authorization and appropriately scoped IAM for any future sensitive operation. The existing emulator Rules tests do not test Admin SDK authorization.

## Errors and Logging

- `src/core/errors/app-errors.ts` defines `AppError` and `toHttpsError`. Existing `HttpsError` values pass through, `AppError` preserves its code/message, and unexpected errors become a generic internal error. User-profile callable handlers use this mapper.
- `src/core/logging/logger.ts` provides `logInfo`, `logWarning`, and `logError`, forwarding a single event string to the Firebase logger. User-profile failures log a generic event without profile contents or personal data; this is not a full audit logging policy.

## Exported Functions

| Export | Firebase Functions v2 trigger | Current behavior |
|---|---|---|
| `healthCheck` | `onRequest` HTTP | Public GET endpoint returning `{ "status": "ok" }`; other methods return 405 with `Allow: GET` and `{ "status": "method_not_allowed" }`. |
| `getMyAuthContext` | `onCall` HTTPS callable | Requires Firebase-provided authenticated context and returns the caller UID plus email verification, phone-number presence, and Super Admin claim booleans. |
| `provisionMyProfile` | `onCall` HTTPS callable | Creates or safely reuses the authenticated caller's `users/{uid}` profile; requires a verified Firebase Auth email for first creation. |
| `getMyProfile` | `onCall` HTTPS callable | Returns only the authenticated caller's allowlisted profile; a missing profile returns `not-found`. |
| `updateMyProfile` | `onCall` HTTPS callable | Updates only allowlisted caller-owned profile fields and synchronizes email only from verified Firebase Auth. |

Contract details are in [Authentication and Health API](../api/authentication-api.md) and [User Management API](../api/user-management-api.md).

## User Profile Authorization

The user management callables derive the profile document ID only from verified `request.auth.uid`, validate inputs with a strict allowlist, and use explicit ownership checks for Admin SDK operations. Firebase Admin bypasses Firestore Rules, so these checks remain mandatory. Direct client reads, listing, creation, updates, and deletion of `users/{uid}` are denied; profile access goes through the callable APIs. `email` is sourced from Firebase Auth and updated only when that account has a verified email. Account status, roles, PAN/KYC, balances, donation totals/counts, badges, and timestamps are not self-service fields. See the [user management API](../api/user-management-api.md) and [ADR 001](../adr/001-user-profile-boundary.md).

## Local Emulator Architecture

`firebase.json` configures Auth, Firestore, Functions, Storage, and Emulator UI on loopback under demo project `demo-gau-sevak`. The repository helper `infra/scripts/run-local-tests.ps1` selects a locally installed Node 22 runtime when available and uses `firebase emulators:exec` so emulator processes stop after the command. Emulator configuration is local-only; it does not provision cloud resources or establish production configuration.

## Generated Build Output and Deployment

`backend/functions/src/` is the TypeScript source of truth, and `backend/functions/package.json` uses the generated `lib/index.js` as its entry point. Generated `lib/` output is tracked and retained because a verified build-before-deploy hook and CI pipeline do not yet exist.

**Recommended policy:** retain generated output until every deployment and CI path reliably builds it from TypeScript. Keep the build command documented and require a fresh build before any deployment so stale compiled JavaScript cannot be deployed. After a verified automated build-before-deploy process is in place, reconsider whether generated output should remain tracked.

At this audit, `firebase.json` contains no Functions `predeploy` build hook, `.github/workflows/` contains only a placeholder, and no CI/deployment workflow runs the build. Firebase deployment therefore has no repository-configured guarantee that `lib/` is freshly generated. Before excluding `lib/` or relying on deployment, add and verify a cross-platform Firebase predeploy build hook and CI build/test job.

## Not Yet Implemented

No donation/order or Razorpay integration, webhook processing, PostgreSQL ledger, refunds, transfers or settlements, Gaushala onboarding/KYC, membership management, moderation, tax certificates/PDF service, DPDP workflow, search, FCM/SMS notification delivery, reports, scheduled business jobs, rate limits, or production operations are implemented in this backend foundation. These remain future work subject to product scope and applicable V2.1 legal, provider, banking, tax, privacy, security, and owner approval gates.
