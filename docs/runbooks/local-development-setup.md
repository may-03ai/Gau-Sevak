# Windows Local Development Setup

**Scope:** local tools and Firebase Emulator Suite only. No Firebase cloud project, deployment, live Razorpay, real donor data, PAN, or bank information is needed. `.firebaserc` defaults to the demo Firebase project `demo-gau-sevak`; all emulator commands in this runbook explicitly use that demo ID.

## Audited Workstation (2026-11-10)

| Component | Observed version/status | Notes |
|---|---|---|
| Windows | Windows 10 Pro 22H2, build 19045.7807, 64-bit | `flutter doctor -v` output. |
| Flutter | 3.44.6 stable | Install location is workstation-specific; configure your own Flutter SDK path. |
| Dart | 3.12.2 stable | Bundled with Flutter. |
| Android SDK | 36.1.0 | At `%LOCALAPPDATA%\Android\sdk`; some Android SDK licenses are not accepted. |
| Java JDK | OpenJDK 21.0.10, Android Studio JBR | `java` was not on PATH and `JAVA_HOME` was unset. JDK 21 meets Firebase Emulator Suite's Java 11+ requirement. Start/test scripts set this JDK for their child process only when available at the configured default path. |
| Node.js | 24.19.0 global; 22.23.4 portable | Global Node 24 remains unchanged. Emulator scripts select Node 22 from `%LOCALAPPDATA%\GauSevak\tools\node-v22.23.4-win-x64`. |
| npm | 11.17.0 global; 10.9.9 portable | npm 10.9.9 is bundled with Node 22.23.4. |
| Git | 2.55.0.windows.3 | Repository metadata is initialized. Milestone 0.5 established baseline commit `b62b0bc37f2ca021c9263cb07ae313f7037b0bb5`. |
| Firebase CLI | 15.35.0 | Already installed at the user-level npm path; no CLI install was needed. |

Flutter Doctor also reports that Android licenses need acceptance, no Android device is currently connected, and Visual Studio with Desktop development with C++ is absent. Visual Studio is only needed for Flutter Windows desktop builds, not Android or Firebase emulators. No version manager (`nvm`, `fnm`, `volta`) was found.

## Node.js Runtime
Node.js 22 is the configured Firebase Functions baseline. Firebase's [runtime guide](https://firebase.google.com/docs/functions/manage-functions) lists Node 22 as supported; this project explicitly does not use Node 20. The Node.js [official release schedule](https://raw.githubusercontent.com/nodejs/Release/main/schedule.json) lists Node 22 EOL as **2027-04-30**. Plan and test an upgrade before that date, then re-verify Firebase runtime availability, SDK compatibility, and provider/test support before changing the pinned runtime.

Node.js v22.23.4 x64 was downloaded from the official Node.js distribution, checked against published SHA-256 `cbc74b5e0982c9dbb41525fd8fb5dcd32fbee237863f7829072f4639a1ce5f20`, and extracted under `%LOCALAPPDATA%\GauSevak\tools`. Global Node 24.19.0 and machine PATH were not changed. The start/test helpers temporarily prepend the portable Node 22 directory for their process tree. Firebase CLI 15.35.0 was verified with that runtime. No version manager was installed.

## Emulator Configuration
`firebase.json` points to the existing Firestore rules, indexes, and Storage rules. `.firebaserc` defaults to the demo project ID. The emulator suite binds only to loopback:

| Emulator | Local endpoint |
|---|---|
| Authentication | `127.0.0.1:9099` |
| Firestore | `127.0.0.1:8080` |
| Cloud Functions | `127.0.0.1:5001` |
| Storage | `127.0.0.1:9199` |
| Emulator UI | `127.0.0.1:4000` |
| Emulator Hub | `127.0.0.1:4400` |
| Emulator logging | `127.0.0.1:4500` |

These are Firebase's documented default service ports, explicitly bound to `127.0.0.1`; all were available during the audit. Keep `--project demo-gau-sevak` on every local emulator command and do not substitute a production project ID. Firebase CLI may download emulator binaries to `%USERPROFILE%\.cache\firebase\emulators` on first run; this is a user-cache download, not cloud provisioning.

Firestore and Storage Rules contain explicit scoped grants for intended client operations and deny unlisted or unauthorized operations by default. Under the current policy, clients access `users/{uid}` profiles only through the authenticated callables; direct profile reads and writes are denied. Firebase Admin SDK bypasses Firestore Rules, so backend operations require independent authentication, ownership, and authorization checks. Rules tests verify client Rules behavior; they do not prove deployed IAM or cover every Admin SDK authorization path. See the [Rules test plan](../testing/security-rules-test-plan.md).

The Functions package currently exports five handlers:

| Export | Trigger | Responsibility |
|---|---|---|
| `healthCheck` | HTTP `onRequest` | Public generic health response. |
| `getMyAuthContext` | HTTPS callable `onCall` | Returns the authenticated caller's UID and selected verification/claim booleans. |
| `provisionMyProfile` | HTTPS callable `onCall` | Creates or safely reuses the authenticated caller's allowlisted profile. |
| `getMyProfile` | HTTPS callable `onCall` | Retrieves only the authenticated caller's profile. |
| `updateMyProfile` | HTTPS callable `onCall` | Updates only the authenticated caller's permitted profile fields. |

These are the implemented backend foundation and user-profile operations only; donation, payment, financial-ledger, membership-administration, and other future product workflows are not implemented.

## Git Setup

The repository is initialized and has a baseline commit. Inspect your local branch, worktree, latest commit, and configured remotes with:

```powershell
git status --short
git branch --show-current
git log -1 --oneline
git remote -v
```

As of 2026-11-12, the `origin` GitHub remote was configured and its `feature/user-management` branch was verified to match local HEAD. This is a dated repository observation, not a requirement to use that branch. Verify the configured remote and its branch SHA for your own checkout before relying on a backup; do not assume another machine or clone has the same remote configuration.

## Commands
Run from the repository root in PowerShell:

```powershell
# Inspect configured project, rules, runtime and ports
.\infra\scripts\show-firebase-local-config.ps1

# Check portable Node 22 directly in this PowerShell session if needed
$node22 = Join-Path $env:LOCALAPPDATA 'GauSevak\tools\node-v22.23.4-win-x64'
$env:PATH = "$node22;$env:PATH"
node --version

# Start in a separate console window
.\infra\scripts\start-firebase-emulators.ps1

# Open the Emulator UI after starting the emulators
Start-Process http://127.0.0.1:4000

# Stop the emulator process tree started by the repository helper
.\infra\scripts\stop-firebase-emulators.ps1

# Run emulator connectivity smoke checks (not application tests)
.\infra\scripts\run-local-tests.ps1

# Build the Functions TypeScript source into backend/functions/lib/
# The build clean script removes and regenerates that output directory.
npm --prefix backend/functions run build

# Run backend typecheck and ESLint
npm --prefix backend/functions run typecheck
npm --prefix backend/functions run lint

# Run backend unit tests; this command builds and regenerates lib/ first
npm --prefix backend/functions test

# Run the combined Firestore and Storage Rules suite (22 Firestore, 4 Storage tests)
.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"

# Build first, then run Functions Emulator integration tests (the script itself does not build)
npm --prefix backend/functions run build
.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"

# Manual start/stop alternative; stop manually with Ctrl+C
firebase emulators:start --project demo-gau-sevak --only auth,firestore,functions,storage,ui
```

Latest verified local test evidence is 58 passing cases across four distinct suites: 18 backend unit tests, 14 Functions Emulator integration tests, 22 Firestore Rules tests, and 4 Storage Rules tests. The Rules cases are the separate client-security suite; they do not verify production IAM or Admin SDK authorization. A same-session emulator regression verifies that disabling Super Admin state denies a subsequent restricted Rules read without refreshing the authenticated client context. Emulator tests use synthetic demo Auth users and emulator services.

`firebase emulators:exec` shuts down the emulator processes it starts after its command exits. With no `-TestCommand`, the helper runs `node infra/scripts/check-emulator-ports.js` inside the emulator execution; this checks connectivity and is not application test coverage. Backend tests cover implemented Functions and profile behavior; Flutter and React UI test suites have not yet been implemented. For test names, limitations, and suite details, see the [backend test plan](../testing/backend-test-plan.md).

If PowerShell blocks scripts, allow them for the current process only, then rerun the command:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Do not change machine-wide execution policy for this setup.

## Troubleshooting
- **Firebase CLI not found:** verify the user npm global bin directory is on PATH and run `firebase --version`. The CLI was already installed during this audit; do not reinstall it unnecessarily.
- **Java not found:** set `JAVA_HOME` to your Android Studio JBR or another supported local JDK 11+ installation, then add its `bin` directory to PATH for the current PowerShell session. For an Android Studio installation under the standard Program Files location: `$env:JAVA_HOME = Join-Path $env:ProgramFiles 'Android\Android Studio\jbr'; $env:Path = "$env:JAVA_HOME\bin;$env:Path"`.
- **Functions runtime mismatch:** install/select Node 22 locally and check `node --version` before Functions emulator testing. Do not use Node 20.
- **Port already in use:** inspect the owning PID with `Get-NetTCPConnection -State Listen -LocalPort <port>` and choose a reviewed free port by updating `firebase.json` and this runbook together. Do not kill unknown processes.
- **Rules deny test access:** default-deny is intentional. Add narrowly scoped emulator-only rule tests and review rules before any permission is opened; never relax production rules to make tests pass.
- **Emulator binary download failure:** check local network/proxy settings and the per-user cache path; no Firebase login or cloud project is required for these emulators.
- **Android build prerequisites:** accept SDK licenses with `flutter doctor --android-licenses` when ready. Install Visual Studio's C++ workload only if Windows desktop builds become a requirement.

## Safety Checklist
- [x] Demo project ID is default and explicitly passed by scripts.
- [x] Emulator endpoints are loopback-only; ports were free at audit time.
- [x] Firestore and Storage Rules retain explicit scoped grants with deny-by-default behavior for unlisted or unauthorized operations.
- [x] No production Firebase config or local `.env` file was present during audit.
- [x] `.env.example` values are blank; no live Razorpay credentials are configured.
- [x] No real PAN/bank data was used; Git metadata is initialized.
- [x] Emulator connectivity smoke check passed for all seven local endpoints; emulator shutdown was verified.
- [x] Install/select Node 22.23.4 for emulator scripts; verify Functions emulator reports Node 22.
- [x] Backend unit, Functions Emulator, Firestore Rules, and Storage Rules test suites have verified local results; Flutter and React UI tests remain future work.
