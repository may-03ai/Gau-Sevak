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
4. `requireSuperAdmin requires the verified boolean custom claim`
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

## 2. Functions Emulator Integration Tests — 13 Cases

File: `backend/functions/tests/emulator.integration.test.cjs`
Command: `.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"` after the build command above. Latest verified result: **13 passed, 0 failed, 0 skipped**.

1. `healthCheck returns only a generic healthy status`
2. `getMyAuthContext rejects unauthenticated callable requests`
3. `getMyAuthContext returns verified caller context and ignores client-supplied UID`
4. `getMyAuthContext recognizes a Firebase Admin-set Super Admin claim`
5. `profile callables reject unauthenticated callers`
6. `provisionMyProfile creates and safely repeats the authenticated user profile`
7. `profile retrieval is self-scoped and missing profiles return not-found`
8. `getMyProfile synchronizes a newly verified Firebase Auth email`
9. `legacy email remains hidden while unverified and is reconciled after verification`
10. `concurrent profile retrieval and update preserve the canonical Auth email`
11. `profile updates allow only validated fields and synchronize verified Auth email`
12. `profile provisioning requires verified Auth email and rejects malformed profile input`
13. `concurrent profile provisioning is duplicate-safe`

The tests create synthetic Auth Emulator users and remove their profiles and accounts during cleanup. These tests exercise the health, account-context, and profile callables through local emulators. Admin SDK operations bypass Firestore Rules, so these integration tests are distinct from the client Rules suite.

## 3. Firestore Rules Tests — 19 Cases

File: `tests/security/security.rules.test.js`
Command: `.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"` (includes the Storage Rules cases below). Latest verified result: **19 passed, 0 failed, 0 skipped**.

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
15. `Super Admin custom claim grants Gaushala reads but not direct sensitive access`
16. `sensitive and administrative collections deny direct client access even to Super Admin claims`
17. `refund requests are donor-readable but all client writes are denied`
18. `users can update only the read flag on their notifications`
19. `unlisted collections remain denied by default`

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
| Functions emulator integration tests | 13 | 13 passed |
| Firestore Rules | 19 | 19 passed |
| Storage Rules | 4 | 4 passed |
| **Total across four suites** | **54** | **54 passed; 0 failed; 0 skipped** |

The 19 Firestore and 4 Storage tests are a separate Milestone 0.4 client-security-rules suite. They are **not** backend authorization tests and do not test Admin SDK bypass paths. Profile callables enforce ownership independently and are covered by Functions emulator integration tests. The earlier baseline was 15 backend unit tests and 10 Functions Emulator integration tests; the latest counts above include the email-consistency regressions. None of these suites implements the broader V2.0/V2.1 payment lifecycle, webhook verification/idempotency, ledger/reconciliation, refunds, membership lifecycle, or production controls. No coverage percentage is configured or claimed.

For detailed Rules scope and open decisions, see [Firebase Security Rules Test Plan](./security-rules-test-plan.md). For function behavior, see [Authentication and Health API](../api/authentication-api.md) and [User Management API](../api/user-management-api.md).
