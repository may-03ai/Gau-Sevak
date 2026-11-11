# Firebase Cloud Functions

This package contains a limited TypeScript backend foundation, organized by domain under `src/`. It currently exports two Firebase Functions v2 handlers:

- `healthCheck`: public HTTP `onRequest`; GET returns a generic healthy status.
- `getMyAuthContext`: HTTPS callable `onCall`; returns the authenticated caller's UID and selected verification/claim booleans using Firebase's verified callable auth context.

Authentication guards, shared error helpers, Firebase Admin initialization, and logger wrappers are also present. The reusable `requireSuperAdmin` guard is not yet connected to an exported administrative function. No donation, payment-provider, webhook, ledger, onboarding, tax-certificate, or other product workflow is implemented. See the [backend architecture](../../docs/architecture/backend-architecture.md) and [API contract](../../docs/api/authentication-api.md).

## Runtime and Build

Use Node.js 22 for Firebase Functions. The package uses strict TypeScript/NodeNext compilation from `src/` to `lib/`; its `main` entry is `lib/index.js`.

```powershell
npm --prefix backend/functions run build
npm --prefix backend/functions run typecheck
npm --prefix backend/functions run lint
npm --prefix backend/functions test
```

`src/` is the TypeScript source of truth, and `package.json` uses the generated `lib/index.js` entry point. The 21 generated `lib/` files are included in the current Milestone 1.0.1 checkpoint and are retained because there is no Firebase `predeploy` build hook or GitHub Actions build/deployment workflow. Require a fresh build before deployment so stale compiled output is not deployed. Once a verified automated build-before-deploy process is in place, reconsider whether generated output should remain tracked. No deployment configuration is changed by this documentation.

## Tests

Backend unit tests: `npm --prefix backend/functions test` (7 cases; builds first).

Functions emulator integration tests:

```powershell
.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"
```

This runs against local Auth, Firestore, Functions, and Storage emulators using the demo project. The separate 19 Firestore Rules and 4 Storage Rules tests are documented in the [backend test plan](../../docs/testing/backend-test-plan.md).

Do not deploy, provision Firebase resources, configure live payments, or add further dependencies until approved setup decisions and applicable V2.1 requirements/gates are resolved.
