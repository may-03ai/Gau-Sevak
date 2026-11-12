# Backend Test Plan

**Status:** Local foundation and user-profile verification run on Node.js 22.23.4 on 2026-11-12. These tests are not production security evidence, business-workflow coverage, or compliance approval.

## Runtime and Commands

Use the project Node.js 22 runtime. From the repository root in PowerShell:

```powershell
npm --prefix backend/functions run build
npm --prefix backend/functions run typecheck
npm --prefix backend/functions run lint
npm --prefix backend/functions test
```

`npm test` builds the TypeScript output before running unit tests. Build before starting the Functions emulator; `test:emulator` does not rebuild while the emulator is discovering functions:

```powershell
npm --prefix backend/functions run build
.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"
```

The helper starts local Auth, Firestore, Functions, and Storage emulators with demo project `demo-gau-sevak`, selects portable Node 22 when available, and shuts the emulators down after the command. Do not replace the demo project with a production ID.

The separate Firestore and Storage Rules suite is run from the repository root with:

```powershell
.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"
```

## 1. Backend Unit Tests — 18 Cases

File: `backend/functions/tests/unit.test.cjs`
Command: `npm --prefix backend/functions test` (builds before test execution). Latest verified result: **18 passed, 0 failed, 0 skipped**.

1. `Firebase Admin is initialized once and reusable Auth/Firestore clients are exported`
2. `requireAuthenticatedUser rejects missing auth and missing UID`
3. `requireAuthenticatedUser returns the UID from verified auth, not request data`
4. `requireActiveSuperAdmin fails closed unless claim and authorization state are valid`
5. `getVerifiedAccountContext returns only the caller UID and verification booleans`
6. `getVerifiedAccountContext reports missing phone verification safely`
7. `application errors map to safe HttpsError responses`
8. `profile validation supports trimmed Unicode names and accepts only en or hi`
9. `profile validation rejects empty, overlong, and control-character names`
10. `profile validation rejects unsupported locales, notification keys, and non-boolean values`
11. `profile validation rejects UID, email, server fields, and all unknown fields`
12. `profile provisioning sources email from verified Firebase Auth and controls timestamps`
13. `profile provisioning requires a verified email only for first creation`
14. `repeated provisioning preserves existing profile fields and synchronizes only verified email`
15. `profile retrieval reconciles a changed verified Auth email`
16. `unverified and legacy emails stay private until Firebase Auth verifies the current email`
17. `missing Firebase Auth users return no email without hiding an existing profile`
18. `profile get and update return not-found for missing records and update only allowed fields`

## 2. Functions Emulator Integration Tests — 14 Cases

File: `backend/functions/tests/emulator.integration.test.cjs`
Command: `.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"` after the build command above. Latest verified result: **14 passed, 0 failed, 0 skipped**.

1. `healthCheck returns only a generic healthy status`
2. `getMyAuthContext rejects unauthenticated callable requests`
3. `getMyAuthContext returns verified caller context and ignores client-supplied UID`
4. `getMyAuthContext recognizes a Firebase Admin-set Super Admin claim`
5. `requireActiveSuperAdmin observes server-managed revocation state`
6. `profile callables reject unauthenticated callers`
7. `provisionMyProfile creates and safely repeats the authenticated user profile`
8. `profile retrieval is self-scoped and missing profiles return not-found`
9. `getMyProfile synchronizes a newly verified Firebase Auth email`
10. `legacy email remains hidden while unverified and is reconciled after verification`
11. `concurrent profile retrieval and update preserve the canonical Auth email`
12. `profile updates allow only validated fields and synchronize verified Auth email`
13. `profile provisioning requires verified Auth email and rejects malformed profile input`
14. `concurrent profile provisioning is duplicate-safe`

The tests create synthetic Auth Emulator users and remove their profiles and accounts during cleanup. The direct guard test uses emulator Firestore state and a test-constructed auth-context shape for its synthetic user; it is not an exported admin callable and does not independently verify Firebase token issuance or callable request-context construction. These tests exercise the health, account-context, and profile callables through local emulators. Admin SDK operations bypass Firestore Rules, so these integration tests are distinct from the client Rules suite.

The unit guard test covers missing auth/UID, absent/false/null/wrong-type claims, missing/disabled/malformed state, a successful enabled state, Firestore read failure, and the generic `permission-denied` mapping. The emulator guard test passes a test-constructed auth-context shape for its synthetic user and exercises real emulator Firestore state; it does not independently verify Firebase token issuance or callable request-context construction.

## 3. Firestore Rules Tests — 22 Cases

File: `tests/security/security.rules.test.js`
Command: `.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"` (includes the Storage Rules cases below). Latest verified result: **22 passed, 0 failed, 0 skipped**.

1. `unauthenticated users cannot read private user, donation, or certificate records`
2. `public users can read active Gaushalas but not suspended Gaushalas`
3. `public users can read active campaigns and approved updates only`
4. `clients cannot read or list user profiles`
5. `clients cannot create, update, or delete user profiles`
6. `donors cannot create or modify donations or payment status`
7. `donors read only their own subscriptions and ownership-constrained donation queries`
8. `donors can read only their own certificates`
9. `users can read only their own membership and cannot forge memberships`
10. `active Owner reads assigned Gaushala information and payouts only`
11. `Owner and Editor can create only pending updates for their assigned Gaushala`
12. `Viewer is read-only and cannot create Gaushala updates or access payouts`
13. `Editor cannot access payouts or cross-tenant admin data; active profiles remain public`
14. `revoked membership does not grant Gaushala access`
15. `Super Admin claim with enabled state grants Gaushala reads but not direct sensitive access`
16. `Super Admin reads require an exact claim and valid enabled authorization state`
17. `clients cannot read or modify Super Admin authorization state`
18. `disabling Super Admin state immediately denies the same authenticated session`
19. `sensitive and administrative collections deny direct client access even to Super Admin claims`
20. `refund requests are donor-readable but all client writes are denied`
21. `users can update only the read flag on their notifications`
22. `unlisted collections remain denied by default`

These are client Rules tests using synthetic fixtures. They do not test Firebase Admin SDK authorization or the actual issuance of Super Admin claims.

## 4. Storage Rules Tests — 4 Cases

The same file and command as the Firestore Rules suite. Latest verified result: **4 passed, 0 failed, 0 skipped**.

1. `Storage serves only published approved public media`
2. `Storage certificates and exports are private to the matching donor`
3. `Storage KYC paths deny direct client access, including authorized admins`
4. `Storage staging uploads require active Owner/Editor membership, matching UID, type, and size`

Rules fixtures seed objects through Rules-disabled test contexts. The 10 MiB staging image cap remains provisional. Storage-to-Firestore IAM behavior has not been validated in a deployed project.

## Results and Limits

| Suite | Cases | Result |
|---|---:|---|
| Backend unit tests | 18 | 18 passed |
| Functions emulator integration tests | 14 | 14 passed |
| Firestore Rules | 22 | 22 passed |
| Storage Rules | 4 | 4 passed |
| **Total across four suites** | **58** | **58 passed; 0 failed; 0 skipped** |

The 22 Firestore and 4 Storage tests are a separate client-security-rules suite. They are **not** backend authorization tests and do not test Admin SDK bypass paths. Profile callables enforce ownership independently and are covered by Functions emulator integration tests. The Rules same-session regression demonstrates that the emulator evaluates changed server-managed state for a subsequent Rules request without refreshing the client context; it cannot revoke already downloaded/offline-cached data. Earlier 15/10 backend counts and 19/4 Rules counts are historical; latest counts above include email-consistency and immediate-revocation cases. None of these suites implements the broader V2.0/V2.1 payment lifecycle, webhook verification/idempotency, ledger/reconciliation, refunds, membership lifecycle, or production controls. No coverage percentage is configured or claimed.

For detailed Rules scope and open decisions, see [Firebase Security Rules Test Plan](./security-rules-test-plan.md). For function behavior, see [Authentication and Health API](../api/authentication-api.md) and [User Management API](../api/user-management-api.md).
