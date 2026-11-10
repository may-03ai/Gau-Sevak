# Windows Local Development Setup

**Scope:** local tools and Firebase Emulator Suite only. No Firebase cloud project, deployment, live Razorpay, real donor data, PAN, or bank information is needed. The default Firebase project is `demo-gau-sevak`; every helper passes this demo ID explicitly.

## Audited Workstation (2026-11-10)

| Component | Observed version/status | Notes |
|---|---|---|
| Windows | Windows 10 Pro 22H2, build 19045.7807, 64-bit | `flutter doctor -v` output. |
| Flutter | 3.44.6 stable | SDK at `C:\Users\hp\Desktop\flutterDev\SDK\flutter`. |
| Dart | 3.12.2 stable | Bundled with Flutter. |
| Android SDK | 36.1.0 | At `%LOCALAPPDATA%\Android\sdk`; some Android SDK licenses are not accepted. |
| Java JDK | OpenJDK 21.0.10, Android Studio JBR | Found at `C:\Program Files\Android\Android Studio\jbr`; `java` is not on PATH and `JAVA_HOME` is unset. JDK 21 meets Firebase Emulator Suite's Java 11+ requirement. Start/test scripts set this JDK for their child process only. |
| Node.js | 24.19.0 global; 22.23.4 portable | Global Node 24 remains unchanged. Emulator scripts select Node 22 from `%LOCALAPPDATA%\GauSevak\tools\node-v22.23.4-win-x64`. |
| npm | 11.17.0 global; 10.9.9 portable | npm 10.9.9 is bundled with Node 22.23.4. |
| Git | 2.55.0.windows.3 | Installed; this workspace currently has no `.git` metadata, so it is not an initialized Git repository. |
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

These are Firebase's documented default service ports, explicitly bound to `127.0.0.1`; all were available during the audit. Demo project IDs prevent operations from reaching real Firebase resources. Keep `--project demo-gau-sevak` on every local command and do not replace the default with a production ID. Firebase CLI may download emulator binaries to `%USERPROFILE%\.cache\firebase\emulators` on first run; this is a user-cache download, not cloud provisioning. The existing Firestore and Storage rules deny all access, so emulator data access will also be denied until rules are deliberately changed and tested.

The Functions package uses `firebase-functions` 7.4.0 only for Firebase CLI codebase discovery and has an empty entry point with no exported functions or business logic. The Functions emulator loaded the empty source under Node 22.23.4. npm reported deprecated transitive `node-domexception` and `glob` packages during initial installation; review dependency health before adding application code.

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

# Open the Emulator UI
Start-Process http://127.0.0.1:4000

# Stop only the process tree started by the start script
.\infra\scripts\stop-firebase-emulators.ps1

# Run emulator connectivity smoke checks (not application tests)
.\infra\scripts\run-local-tests.ps1

# Run Firestore and Storage Security Rules tests
.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"

# Run a future local test command under emulators:exec
.\infra\scripts\run-local-tests.ps1 -TestCommand "npm test"

# Manual start/stop alternative; stop manually with Ctrl+C
firebase emulators:start --project demo-gau-sevak --only auth,firestore,functions,storage,ui
```

`firebase emulators:exec` shuts down the emulator processes after its command exits. The default helper checks only that configured local ports accept connections; it is not application test coverage. The explicit Rules Unit Testing command runs the Firestore/Storage authorization suite. No application feature test suite exists yet.

If PowerShell blocks scripts, allow them for the current process only, then rerun the command:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Do not change machine-wide execution policy for this setup.

## Troubleshooting
- **Firebase CLI not found:** verify the user npm global bin directory is on PATH and run `firebase --version`. The CLI was already installed during this audit; do not reinstall it unnecessarily.
- **Java not found:** the scripts use Android Studio's JDK 21 for their child process. For a manual command in the current PowerShell session, run `$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'; $env:Path = "$env:JAVA_HOME\bin;$env:Path"`.
- **Functions runtime mismatch:** install/select Node 22 locally and check `node --version` before Functions emulator testing. Do not use Node 20.
- **Port already in use:** inspect the owning PID with `Get-NetTCPConnection -State Listen -LocalPort <port>` and choose a reviewed free port by updating `firebase.json` and this runbook together. Do not kill unknown processes.
- **Rules deny test access:** default-deny is intentional. Add narrowly scoped emulator-only rule tests and review rules before any permission is opened; never relax production rules to make tests pass.
- **Emulator binary download failure:** check local network/proxy settings and the per-user cache path; no Firebase login or cloud project is required for these emulators.
- **Android build prerequisites:** accept SDK licenses with `flutter doctor --android-licenses` when ready. Install Visual Studio's C++ workload only if Windows desktop builds become a requirement.

## Safety Checklist
- [x] Demo project ID is default and explicitly passed by scripts.
- [x] Emulator endpoints are loopback-only; ports were free at audit time.
- [x] Firestore and Storage default-deny rules remain referenced unchanged.
- [x] No production Firebase config or local `.env` file was present during audit.
- [x] `.env.example` values are blank; no live Razorpay credentials are configured.
- [x] No real PAN/bank data or Git metadata was found/initialized.
- [x] Emulator connectivity smoke check passed for all seven local endpoints; emulator shutdown was verified.
- [x] Install/select Node 22.23.4 for emulator scripts; verify Functions emulator reports Node 22.
- [ ] Add actual application and rules test suites; the current check verifies connectivity only.
