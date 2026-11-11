# Technical Decisions and Open Questions

**Purpose:** Record the project baseline after inspecting the supplied references on 2026-11-10. This is not an ADR set, legal opinion, CA approval, provider approval, implementation evidence, or production sign-off. V2.1 is a corrective override pack, not a complete replacement for V2.0.

## Source and Status Convention
- **Confirmed input:** explicitly supplied by the project owner or stated in the source files.
- **Proposed baseline:** a technical direction suitable for design/testing, pending owner/engineering approval.
- **Approval required:** needs written specialist/provider evidence; do not implement a consequential behavior based on assumption.
- **Unresolved:** insufficient information; keep blocked or exclude from MVP.

Both PDFs were present and all pages yielded non-empty `pypdf` text: V2.0 105/105; V2.1 18/18. Some V2.0 Indic/emoji glyphs were garbled in extracted text; verify those specific passages visually before using exact copy. See `docs/source/README.md`.

## Decision Register
| Topic | Baseline / source correction | Status / next action |
|---|---|---|
| V2.0/V2.1 relationship | V2.0 provides broad product scope. V2.1 supersedes conflicts but does not re-specify every feature. | Confirmed source precedence. Maintain both and trace requirements; no consolidated master created. |
| Firebase vs PostgreSQL | Firestore is application data and projection/read model; V2.1 names Cloud SQL PostgreSQL authoritative for financial ledger and durable webhook uniqueness. | Proposed architecture. Approve exact ownership, SQL model, cross-store reconciliation, backup, access and migration design. |
| Ledger accounting | Start unpartitioned; integer paise; append-only linked events and source uniqueness. An event table alone is not balanced double-entry accounting. | CA/accounting architect must approve chart of accounts, postings, timing, fee/tax, liabilities and reconciliation before real funds. |
| Flutter | Flutter/Dart/Riverpod; V2.0 specifies Riverpod and feature-oriented layers. | Proposed. Confirm clean-architecture boundaries, offline cache/outbox rules, supported OS/device floor, Flutter/Dart pin, localization and recovery flows. |
| React administration | Separate React + TypeScript admin apps; current project instruction specifies Ant Design. V2.0 also names React/Ant Design. | Proposed. Decide React/build/tool versions, UI policy, API client/query strategy, package boundaries and accessibility baseline. |
| Node.js runtime | V2.1 recommends Node 22; Firebase Functions guide checked 2026-11-10 lists Node 22 as supported and Node 20 as deprecated/older. Project instruction says use Node 22 unless Firebase docs confirms another compatible runtime. | Configure Node 22 as the Firebase Functions baseline. Node.js official schedule lists upstream EOL as 2027-04-30; plan an upgrade before then and re-verify Google/Firebase support. Local Node 24.19.0 is installed but is not the configured Functions runtime. Do not use Node 20 or switch to Node 26 without official Firebase runtime confirmation. |
| Authentication | Firebase Auth is the specified identity provider; derive UID server-side. Super Admin privilege and Gaushala membership are separate server-managed authorization sources. | Proposed. Approve sign-in methods, account recovery, verification/step-up, MFA policy, claims refresh and support-assisted recovery. No sensitive recovery trivia. |
| Authorization / tenant isolation | Backend checks role, tenant, object, operation and purpose. Admin SDK bypasses Firestore rules. | Required design principle. Define owner/editor/viewer matrix and test every endpoint, export, query, storage path and worker. |
| Razorpay Route | Sandbox-first. Exact donation marketplace, linked accounts, fees, transfers, settlements, refunds, holds and foreign/recurring flows require account-specific confirmation. | Written Razorpay approval and payments counsel opinion required. No live setup. Do not assume PA license coverage or platform custody. |
| Webhooks | Verify HMAC over exact raw body; durable unique provider/account/environment/event inbox; persist before ACK; process async/idempotently with ledger/outbox. | Proposed from V2.1. Verify current Razorpay headers/SDK/raw-body behavior. Do not invent timestamp fields or use Firestore as SQL `UNIQUE` storage. |
| Firestore / SQL security | Deny-by-default client rules, server-only financial writes, least-privilege SQL and IAM. | Required design principle. Firestore and Storage now have explicit client grants plus default-deny fallbacks; local Rules tests pass, but Admin SDK authorization, deployed IAM, networking, query rules, audit access, encryption, and production verification remain open. |
| Storage and PDF | Cloud Run is for stateless PDF work; restricted object access; short-lived signed links; object retention is separate from URL expiration. | Proposed. CA must approve tax-year/form/data/sample/issuer workflow; privacy/security approve retention, public verification and access. No statutory certificate MVP. |
| Search and deep links | Typesense is a derived public-profile index on durable/managed hosting; current state rechecked before action. Replace Firebase Dynamic Links with Android App Links/iOS Universal Links and web fallback. | V2.1 correction. Choose provider/hosting/domain and sync/reconciliation design in ADR. Never index donor/sensitive data. |
| Recurring / CSR / FCRA | V2.0 describes these but V2.1 requires provider/legal/recipient gates and correct role classification. | Exclude from MVP. Written provider/counsel/bank/CA/CSR eligibility approvals and dedicated test matrices required first. |

## Conflicts Identified (V2.1 Controls)
- V2.0's ₹25 Cr annual donation PA-license trigger and claims of already-confirmed PA structure are withdrawn; obtain an opinion on the exact funds flow and written Razorpay acceptance (V2.1 pp. 2, 4, 15–17).
- V2.0 universal ₹50,000 donor PAN/KYC threshold, ₹2,000 PAN rule, fixed five-year PMLA retention, and broad legal assertions are not safe requirements. V2.1 requires activity-specific legal basis and record-class retention review (pp. 4–6).
- V2.0 universal Form 10BE/10BD and tax-benefit promise is superseded by tax-year-specific transition handling and FN 113/FN 114 process described by V2.1; CA/donee approval is mandatory (pp. 4–5, 13, 15–16).
- V2.0 blanket NRI/international-card FCRA rules and arbitrary separate Linked Account are replaced by citizenship/source classification and designated-account/provider confirmation; block uncertain cases pending review (V2.1 pp. 2, 5, 15–16).
- V2.0 blanket Mumbai-only data localization, universal 30-day deletion, and PMLA override language are withdrawn; use phased DPDP commencement and record-specific retention decisions (V2.1 pp. 2, 5–6, 15–16).
- V2.0 PA escrow wording, unconditional seven-day refund guarantee and automatic 30-day refund behavior are not approved; define policy with counsel, recipient and provider (V2.1 pp. 3, 6, 11, 15).
- V2.0 Cloud SQL partitioned uniqueness assumptions are invalid as written; V2.1 recommends unpartitioned ledger initially. Firestore has no arbitrary unique-field constraint; durable SQL inbox or atomic event-ID document key is needed (V2.1 pp. 2, 8–9).
- V2.0 webhook timestamp field, `ON CONFLICT` against Firestore, overwritten payment attempts, synchronous side effects, and scheduler-created subscription charges are superseded (V2.1 pp. 2, 9–12).
- V2.0 Typesense multi-node on ordinary Cloud Run and Firebase Dynamic Links are superseded (V2.1 pp. 2, 7, 12–13).
- V2.0's managed Cloud SQL `pgBackRest`/direct WAL-archiving plan is not a safe default; V2.1 calls for Cloud SQL native backups and point-in-time recovery, with logical exports and tested restores. Verify the exact managed-service capabilities before selecting a backup design (V2.1 p. 13).
- V2.0 self-awarded readiness/compliance scores are rejected; use evidence-status gates (V2.1 pp. 2, 14–15).
- V2.0 Phase 1 live donations conflict with V2.1's explicit no-real-money launch status; use sandbox until all applicable gates pass (V2.1 pp. 2, 15–17).

## Duplicate / Drift Risks
- Authentication, roles, membership and account recovery recur across V2.0 Parts 4, 7, 8, 24, 44 and 46. Maintain one canonical role/identity specification and link all UX/API requirements to it.
- Payment state, webhook handling, retries, refunds, idempotency and recurring logic recur across Parts 4–6, 25, 33–34 and 53. Keep one canonical state model and event contract; V2.1 corrections must be reflected in every referenced workflow.
- Tax eligibility, PAN handling, Form 10BD/10BE generation, exports and annual batches recur across Parts 2, 8, 14, 27, 38 and 49. Use one tax-year-specific approved data contract and issuance process.
- Privacy, retention, consent, deletion, analytics and breach response recur across Parts 2, 28, 32, 49 and 53. Maintain one purpose/record-class matrix and link each collection and integration to it.
- Campaigns, notifications, content moderation and festival operations recur across Parts 9–10, 29, 45, 51–52. Define one moderation/status model and notification-purpose taxonomy before implementation.

## Incomplete Requirements / Approval Dependencies
- **Indian payments counsel + Razorpay compliance:** platform/operator role, PA applicability, exact charitable Route model, custody/funds flow, fees, linked accounts, transfers/holds, refunds/reversals, recurring, foreign flows, disputes and chargebacks.
- **Donee + tax counsel/CA:** eligible legal entity and approval migration, accountable FN 113 filer/FN 114 issuer, required fields and donor notice, tax-year transitions, certificate samples, GST/commission, TDS/chart of accounts and accounting policy.
- **FCRA counsel + bank + provider:** donor citizenship/source decision tree, recipient registration/prior permission, designated account, receiving/settlement route. No foreign donations until approved.
- **Privacy counsel / DPO function:** Gau-Sevak's role by processing purpose, dated DPDP commencement matrix, notices/consents, rights/grievance, processors, breach reporting, retention/deletion/legal holds and cross-border transfer review.
- **CSR counsel/CA and recipient:** implementing-agency eligibility, CSR-1, Schedule VII/project evidence and separate reporting/tax treatment.
- **Security lead / independent assessor:** threat model, roles, tenant isolation, KYC access, data minimization, secrets/IAM, rules/storage, audit, incident response and penetration-test findings.
- **Finance/SRE/DevOps:** balanced ledger, reconciliation, environments, region, private networking, backups/restore, RPO/RTO, SLOs, budgets, queue recovery, runbooks and on-call ownership.

No legal conclusion or approval is made here. Keep any gated feature blocked until evidence is recorded and reviewed.

## Milestone 0.3 Local Environment Audit
- Windows 10 Pro 22H2 build 19045.7807; Flutter 3.44.6 stable; Dart 3.12.2; Android SDK 36.1.0; Android Studio JDK 21.0.10; global Node 24.19.0/npm 11.17.0; portable Node 22.23.4/npm 10.9.9; Git 2.55.0.windows.3; Firebase CLI 15.35.0.
- Firebase CLI is already installed. Do not run `npm install -g firebase-tools` unless a future audit finds it missing.
- `java -version` is not available on PATH; Flutter Doctor finds Android Studio's JDK 21. `JAVA_HOME` is unset. Local scripts select the bundled JDK in their child process only.
- Node 22 is the Firebase Functions runtime in `firebase.json` and `backend/functions/package.json`. Node 22.23.4 is installed under user AppData and selected by helper scripts; global Node 24.19.0 and machine PATH remain unchanged. Upstream EOL is 2027-04-30; plan an upgrade before then. Node 20 is not an approved fallback.
- At the original scaffold stage, the workspace had no `.git` metadata, so a Git-tracked-secret audit was not applicable then; this was superseded when Milestone 0.5 established the Git baseline at `b62b0bc37f2ca021c9263cb07ae313f7037b0bb5`. The current branch is `feature/backend-bootstrap`. Local file/config safety checks are recorded in `docs/runbooks/local-development-setup.md`.
- Emulator services are configured for Auth, Firestore, Functions, Storage and UI, bound to loopback under demo project `demo-gau-sevak`. Emulator binaries were downloaded to the user cache; connectivity smoke checks passed on all seven configured ports under Node 22.23.4. The Functions emulator confirmed `Using node@22 from host`. This is a connectivity smoke check, not an application or security-rule test.
- `backend/functions` now contains the limited baseline exports `healthCheck` and `getMyAuthContext`, shared auth/error/logging helpers, and Firebase Admin initialization. Its pinned runtime is Node 22; dependencies include Firebase Admin and Functions SDKs. Build, type-check, lint, 7 unit tests, and 4 emulator integration tests passed under Node 22.23.4 on 2026-11-10. This is local verification only, not product approval or production readiness; business workflows and live integrations remain unimplemented.
- Auth, Firestore, Functions, Storage, UI, Hub, and logging emulator endpoints were reachable during the smoke test and shut down afterward. Detached start/stop helper lifecycle was exercised; no listeners remain.
- Portable Node 22.23.4 was installed from the official Node.js distribution and SHA-256 checked, without machine-wide PATH changes or a version manager. `java.exe` is only available from Android Studio JBR, and test/start scripts select it in child-process environments without persistent machine-level changes.
