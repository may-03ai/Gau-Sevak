# Firebase Cloud Functions

This package contains a limited TypeScript backend foundation, organized by domain under `src/`. It currently exports five Firebase Functions v2 handlers:

- `healthCheck`: public HTTP `onRequest`; GET returns a generic healthy status.
- `getMyAuthContext`: HTTPS callable `onCall`; returns the authenticated caller's UID and selected verification/claim booleans using Firebase's verified callable auth context.
- `provisionMyProfile`, `getMyProfile`, and `updateMyProfile`: authenticated HTTPS callables for provisioning and managing only the caller's allowlisted profile.

Authentication guards, shared error helpers, Firebase Admin initialization, and logger wrappers are also present. User profile operations derive ownership from verified `request.auth.uid`; Firebase Auth supplies the canonical email, and direct client profile access is denied by Firestore Rules. The asynchronous `requireActiveSuperAdmin` guard requires both the exact verified custom claim and a valid enabled `super_admin_access/{uid}` state document; missing, malformed, disabled, or inaccessible state is denied. It is not connected to an exported administrative function. No production claim-assignment process or audit writer is approved or implemented. No donation, payment-provider, webhook, ledger, onboarding, or tax-certificate workflow is implemented. See [ADR 002](../../docs/adr/002-super-admin-immediate-revocation.md), the [backend architecture](../../docs/architecture/backend-architecture.md), [Authentication and Health API](../../docs/api/authentication-api.md), and [User Management API](../../docs/api/user-management-api.md).

## Runtime and Build

Use Node.js 22 for Firebase Functions. The package uses strict TypeScript/NodeNext compilation from `src/` to `lib/`; its `main` entry is `lib/index.js`.

```powershell
npm --prefix backend/functions run build
npm --prefix backend/functions run typecheck
npm --prefix backend/functions run lint
npm --prefix backend/functions test
```

`src/` is the TypeScript source of truth, and `package.json` uses the generated `lib/index.js` entry point. Generated `lib/` output is tracked and retained because there is no Firebase `predeploy` build hook or GitHub Actions build/deployment workflow. Require a fresh build before deployment so stale compiled output is not deployed. Once a verified automated build-before-deploy process is in place, reconsider whether generated output should remain tracked.

## Tests

Backend unit tests: `npm --prefix backend/functions test` (18 cases; builds first). Latest verified result: 18 passed.

Functions emulator integration tests (build first; the test script does not change `lib/` during emulator discovery):

```powershell
npm --prefix backend/functions run build
.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"
```

This runs against local Auth, Firestore, Functions, and Storage emulators using the demo project (14 integration cases). Latest verified result: 14 passed. The separate client Rules suites have 22 Firestore Rules tests and 4 Storage Rules tests; their latest verified results are 22 and 4 passed, respectively. These Rules tests verify client access policy; they do not test backend Admin SDK authorization. Across the four suites, 58 test cases passed.

Do not deploy, provision Firebase resources, configure live payments, or add further dependencies until approved setup decisions and applicable V2.1 requirements/gates are resolved.
