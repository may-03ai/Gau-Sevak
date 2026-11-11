# Backend Test Plan

**Status:** Local foundation checks only. Results below reflect the Node 22.23.4 verification run on 2026-11-10. They are not production security evidence, business-workflow coverage, or compliance approval.

## Runtime and Commands

Use the project Node.js 22 runtime. From the repository root in PowerShell:

```powershell
npm --prefix backend/functions run build
npm --prefix backend/functions run typecheck
npm --prefix backend/functions run lint
npm --prefix backend/functions test
```

`npm test` builds the TypeScript output before running unit tests. The emulator integration command also builds first:

```powershell
.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"
```

The helper starts local Auth, Firestore, Functions, and Storage emulators with demo project `demo-gau-sevak`, selects portable Node 22 when available, and shuts the emulators down after the command. Do not replace the demo project with a production ID.

The separate Firestore and Storage Rules suite is run from the repository root with:

```powershell
.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"
```

## 1. Backend Unit Tests — 7 Cases

File: `backend/functions/tests/unit.test.cjs`
Command: `npm --prefix backend/functions test` (builds before test execution).

1. `Firebase Admin is initialized once and reusable Auth/Firestore clients are exported` — default Admin app reuse/initialization and Auth/Firestore exports.
2. `requireAuthenticatedUser rejects missing auth and missing UID` — rejects null auth and empty UID.
3. `requireAuthenticatedUser returns the UID from verified auth, not request data` — verified UID takes precedence over client data.
4. `requireSuperAdmin requires the verified boolean custom claim` — rejects a false claim and accepts a true claim.
5. `getVerifiedAccountContext returns only the caller UID and verification booleans` — response allowlist and ignoring client-supplied identity/sensitive claim data.
6. `getVerifiedAccountContext reports missing phone verification safely` — missing verification claims map to false values.
7. `application errors map to safe HttpsError responses` — known and unexpected error mapping.

## 2. Functions Emulator Integration Tests — 4 Cases

File: `backend/functions/tests/emulator.integration.test.cjs`
Command: `.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"`.

1. `healthCheck returns only a generic healthy status` — GET result and unsupported-method behavior.
2. `getMyAuthContext rejects unauthenticated callable requests` — unauthenticated callable error.
3. `getMyAuthContext returns verified caller context and ignores client-supplied UID` — emulator-issued caller identity and ignored spoofed input.
4. `getMyAuthContext recognizes a Firebase Admin-set Super Admin claim` — custom claim visibility after emulator sign-in.

The tests create synthetic Auth Emulator users and remove them during cleanup. These integration tests exercise only the health and account-context functions using local emulators.

## 3. Firestore Rules Tests — 19 Cases

File: `tests/security/security.rules.test.js`
Command: `.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"`.

1. `unauthenticated users cannot read private user, donation, or certificate records`
2. `public users can read active Gaushalas but not suspended Gaushalas`
3. `public users can read active campaigns and approved updates only`
4. `donors read only their own profile and cannot change sensitive fields`
5. `users can create only allowlisted profile fields`
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

The same file and command as the Firestore Rules suite:

1. `Storage serves only published approved public media`
2. `Storage certificates and exports are private to the matching donor`
3. `Storage KYC paths deny direct client access, including authorized admins`
4. `Storage staging uploads require active Owner/Editor membership, matching UID, type, and size`

Rules fixtures seed objects through Rules-disabled test contexts. The 10 MiB staging image cap remains provisional. Storage-to-Firestore IAM behavior has not been validated in a deployed project.

## Results and Limits

| Suite | Cases | Result |
|---|---:|---|
| Backend unit tests | 7 | 7 passed |
| Functions emulator integration tests | 4 | 4 passed |
| Firestore Rules | 19 | 19 passed |
| Storage Rules | 4 | 4 passed |

The 19 Firestore and 4 Storage tests are a separate Milestone 0.4 client-security-rules suite. They are **not** backend authorization tests and do not test Admin SDK bypass paths. None of these suites implements the broader V2.0/V2.1 payment lifecycle, webhook verification/idempotency, ledger/reconciliation, refunds, membership lifecycle, tenant authorization in backend functions, or production controls. No coverage percentage is configured or claimed.

For detailed Rules scope and open decisions, see [Firebase Security Rules Test Plan](./security-rules-test-plan.md). For function behavior, see [Authentication and Health API](../api/authentication-api.md).
