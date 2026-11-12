# Milestone Tracker

**Status convention:** Not started; In progress; In review; Blocked; Complete with evidence. A milestone cannot be marked complete because documentation or sample code exists; attach test/approval evidence. V2.1 overrides V2.0 conflicts. The sequence below is proposed and requires owner review.

## Milestone 0 — Project Foundation
### 0.1 Scaffold and readiness inventory — Complete with evidence
- [x] Inspect workspace, scaffold, documentation, and installed core tools.
- [x] Record missing CLI/tools and Windows/Android prerequisites without installing packages.
- [x] Preserve source PDFs and avoid cloud/payment configuration.

### 0.2 Documentation and architecture baseline — Complete (owner accepted)
- [x] Verify both reference PDFs, page count, and text extraction coverage.
- [x] Map product features, roles, architecture responsibilities, conflicts, and future phases.
- [x] Record technical decisions, open questions, approval gates, and source extraction limitations.
- [x] Product owner accepts the documentation baseline for development.

### 0.3 Local Development Environment and Firebase Emulator Foundation — In review (owner review pending)
- [x] Audit Windows, Flutter, Dart, Android SDK, Java, Node.js, npm, Git, and Firebase CLI versions.
- [x] Verify Firebase CLI exists; skip global installation because version 15.35.0 is present.
- [x] Verify Node 22 runtime support and upstream lifecycle; record EOL and upgrade requirement.
- [x] Verify bundled JDK 21, Java PATH state, and Firebase Emulator Suite Java requirement.
- [x] Configure demo-only project, loopback emulator ports, existing rules/index paths, and helper scripts.
- [x] Add local setup and troubleshooting runbook; preserve deny-by-default rules with explicit reviewed grants.
- [x] Download emulator binaries to the user cache and run connectivity checks for all seven configured local endpoints.
- [x] Exercise detached start/stop helpers; verify the process tree stops and ports close.
- [x] Install and verify portable Node 22.23.4 under user AppData; emulator smoke confirms Node 22 is used.
- [ ] Product owner reviews the local setup and safety checks.

### 0.4 Firebase Security Policy and Automated Testing — In review
- [x] Document Firestore and Storage access matrices from the approved membership, claim, collection, and path contracts.
- [x] Implement Firestore owner/editor/viewer, donor, Super Admin claim, field allowlist, and default-deny rules.
- [x] Implement Storage public-publication metadata, private donor paths, membership-validated staging, MIME/size checks, and default-deny rules.
- [x] Add Node 22-compatible `@firebase/rules-unit-testing` suite for Firestore and Storage.
- [x] Execute the suite against local demo emulators under Node 22: 23/23 passed (19 Firestore, 4 Storage).
- [ ] Confirm provisional 10 MiB staged image cap with product owner.
- [ ] Review deployed Storage-to-Firestore IAM permission and backend Admin SDK authorization before any cloud deployment.
- [ ] Product owner reviews test evidence and remaining gaps.

### 0.5 Git Baseline — Complete with evidence
- [x] Initialize Git and record the project baseline at `b62b0bc37f2ca021c9263cb07ae313f7037b0bb5`.

### 0.6 Development Workstation and CI Baseline — In progress
- [ ] Decide supported Windows baseline and Android/iOS build targets.
- [ ] Resolve Android license state; install Visual Studio C++ workload only if Windows desktop builds are required.
- [ ] Approve package managers and tool version pinning after architecture approval.
- [ ] Configure CI to build before deployment and run lint, type-checks, unit/emulator tests, secret scanning, and dependency scanning.
- [ ] Define the emulator strategy and required CI quality gates.

## Pre-production and external approval gates

These are workflow-specific and production-release gates, not a blanket block on safe local or sandbox development. Keep gated behavior disabled until the applicable approval is documented with named owners, dated evidence, and required independent review. V2.1 G1–G10 requirements are:

| Gate | Required approval evidence | Owner |
|---|---|---|
| G1 — Legal funds-flow opinion | Written Indian legal opinion on platform role, payment-aggregator applicability, custody of funds, linked-account model, and refunds. | Founder + payments counsel |
| G2 — Razorpay approval | Written approval for the exact charity marketplace and Route model, including linked accounts, fees, payout holds, refunds/reversals, recurring payments, and any foreign-payment flow. | Payments lead |
| G3 — Donee / bank KYC | Verify each Gaushala’s legal identity, bank account, entity PAN, current registrations, authorized signatory, and applicable beneficial/controlling-person checks. | Compliance ops |
| G4 — Tax forms | CA-approved migration of legacy approvals, Section 133 eligibility, FN 113 data mapping, FN 114 sample, and correction/reissue process. | CA + donee |
| G5 — FCRA | No foreign donations until the citizenship/source decision tree, valid registration or prior permission, designated SBI account, and provider/bank route are approved. | FCRA counsel + bank |
| G6 — DPDP | Dated commencement matrix, privacy notice, consent records, grievance process, processor contracts, rights workflow, breach response, and retention schedule. | Privacy counsel / DPO function |
| G7 — Ledger / reconciliation | Capture, transfer, settlement, refund, reversal, and fees reconcile to provider test reports with no duplicate or missing financial events. | Finance + backend |
| G8 — Security | Threat model, Rules/IAM tests, secret and dependency scans, external penetration test, and closure or documented acceptance of all critical/high findings. | Security lead |
| G9 — Reliability | Successful backup restoration, incident runbooks, alert drills, load test, queue retry/dead-letter test, provider outage test, and webhook replay test. | SRE / DevOps |
| G10 — Customer operations | Published terms, refund/dispute policy, grievance contact, support SLA, suspension communications, and incident-notification templates. | Customer operations |

Additional pending owner and specialist decisions:
- [ ] Security, privacy, payments, finance/CA, and legal owners confirm their decision backlog.
- [ ] Confirm donee eligibility, tax-reporting/certificate ownership, accounting, and ledger policy with the CA and donee.
- [ ] Confirm FCRA/foreign-donation policy and DPDP commencement, roles, and retention with qualified specialists.
- [ ] Confirm whether the Milestone 1.0.2 verified-email requirement should apply platform-wide; it is not an automatically permanent policy.
- [x] Confirm the Firebase runtime guide lists Node 22 and record official Node upstream EOL as 2027-04-30.
- [ ] Re-check Google Cloud's specific runtime decommission schedule before any cloud deployment.
- [ ] Approve environments, regions, IAM, state, budgets, data boundaries, and support/incident ownership.

## Milestone 1 — Secure Development Foundations
- [ ] Create approved dev-only Firebase project/emulator configuration; do not create production resources.
- [ ] Establish independent mobile, backend, Gaushala Admin, and Super Admin build/test workflows.
- [ ] Define versioned framework-neutral API contracts and strict TypeScript/Dart analysis.
- [ ] Define Firebase Auth configuration, role/membership source, and service identities without broad grants.
- [ ] Add fail-closed rule tests, synthetic fixtures, local secrets guidance, and audit/logging baseline.

### 1.0.1 Firebase Functions Backend Bootstrap — Complete with evidence (`11d3dd5`)
- [x] Add Firebase Admin initialization, reusable authentication guards, safe error helpers, and logger wrappers.
- [x] Export the limited `healthCheck` HTTP function and `getMyAuthContext` authenticated callable.
- [x] Verify an isolated TypeScript build, backend unit tests, Functions emulator integration tests, Rules suites, type-check, and lint; see [backend test plan](../testing/backend-test-plan.md).
- [x] Document backend architecture, current API contracts, test scope, and generated-output/deployment-build limitations.
- [x] Commit the reviewed backend bootstrap checkpoint as `11d3dd5` on the feature branch.

This milestone establishes the Firebase Functions backend foundation only. It does not complete broader Milestone 1 work or imply production readiness.

### 1.0.2 User Management Backend — Complete for local-development scope (`01b7f52`)
- [x] Implement duplicate-safe profile provisioning, own-profile retrieval, and permitted profile updates.
- [x] Derive ownership from verified callable auth context; validate inputs with strict allowlists and use Admin Auth as the canonical email source.
- [x] Deny direct client access to user profile documents under the current callable-only policy.
- [x] Verify backend unit tests, Functions Emulator integration tests, Firestore Rules tests, and Storage Rules tests; see [backend test plan](../testing/backend-test-plan.md).
- [x] Document the profile API, ownership boundary, and email verification policy; commit as `01b7f52` on the feature branch.

The verified-email requirement is the current Milestone 1.0.2 implementation policy, not a permanently approved platform-wide rule. Product-owner confirmation remains pending. Completion is for the implemented and tested local-development scope and does not imply production readiness.

### 1.0.3 Authentication and Authorization Hardening — Not started

### 1.0.4 Gaushala Membership Management — Not started

## Agreed engineering roadmap IDs — cross-reference

The existing detailed Milestone 2–10 workstream headings below are retained. This cross-reference aligns them with the agreed engineering sequence without renumbering or replacing those detailed checklists.

| Agreed engineering ID | Agreed milestone | Existing detailed workstream(s) |
|---|---|---|
| 2.0 | Flutter Donor App UI | Milestone 2 — Donor MVP Shell (No Live Money) |
| 3.0 | Gaushala Discovery and Profile | Milestones 3 and 5 — Gaushala and Platform Administration; Marketplace Discovery and Content |
| 4.0 | Sandbox Donation System | Milestone 4 — Payment and Ledger Sandbox |
| 5.0 | Admin Portals | Milestone 3 — Gaushala and Platform Administration |
| 6.0 | Campaigns and Notifications | Milestone 5 — Marketplace Discovery and Content |
| 7.0 | Tax Documents and Recurring Donations | Milestones 6 and 7 — Refunds, Reports, Tax Documents, and Privacy; Recurring Donations and Restricted Routes |
| 8.0 | Future Growth and Expansion | Milestone 8 — Future Programs: CSR, Sponsorship, In-Kind Drives |
| 9.0 | Production Preparation | Milestones 9 and 10 — Operational Scale and Release Candidate; Production Launch and Monitoring |

## Milestone 2 — Donor MVP Shell (No Live Money)
- [ ] Approve one-Gaushala pilot workflow, language, supported devices, and acceptance criteria.
- [ ] Implement approved sign-in/profile and account recovery.
- [ ] Implement public profile and accessible loading/empty/error/offline states.
- [ ] Implement donation intent/payment-attempt UI and sandbox-only status/history, if provider sandbox is approved.
- [ ] Verify no client-side privileged keys, tax promises, or authoritative financial state.

## Milestone 3 — Gaushala and Platform Administration
- [ ] Build approved application/onboarding and document-review state machine.
- [ ] Define owner/editor/viewer permission matrix, tenant isolation, admin MFA/step-up, and audit events.
- [ ] Build Super Admin review/suspension/moderation and support workflows.
- [ ] Build Gaushala Admin profile/content/report workflows after marketplace scope approval.
- [ ] Test cross-tenant reads, exports, writes, membership changes, and suspended-recipient behavior.

## Milestone 4 — Payment and Ledger Sandbox
- [ ] Approve ledger model, balanced posting rules, amount/currency constraints, reconciliation and migration policy.
- [ ] Implement sandbox create-order/payment-attempt idempotency after current API review.
- [ ] Implement raw-body webhook verification and durable unique inbox; acknowledge only after persistence.
- [ ] Implement async worker/outbox, retries, dead-letter handling, and Firestore read projection.
- [ ] Test duplicate/out-of-order/replayed events, amount mismatch, crashes, retries, transfer/settlement states, and repair reconciliation.

## Milestone 5 — Marketplace Discovery and Content
- [ ] Implement multi-Gaushala public profiles, approval/moderation, search, and category/location filters.
- [ ] Choose durable Typesense hosting or approved alternative; implement retry, reconciliation, status recheck, and fallback.
- [ ] Replace Firebase Dynamic Links with controlled-domain App Links/Universal Links and web fallback.
- [ ] Add campaigns, updates, festival features, and notifications only after content/privacy/moderation policies are approved.
- [ ] Verify donor data and sensitive fields are never indexed.

## Milestone 6 — Refunds, Reports, Tax Documents, and Privacy
- [ ] Approve refund/dispute/chargeback policy, authority, provider behavior, and post-settlement recovery.
- [ ] Implement financial operations and scoped admin reports with audit and rate limits.
- [ ] CA/donee approve tax-year eligibility, forms, fields, filing ownership, sample PDFs, corrections, and retention before statutory certificates.
- [ ] Implement consent/purpose and DPDP rights workflows against the dated commencement and retention matrix.
- [ ] Validate access controls, short-lived links, public verification anti-enumeration, and document deletion/legal holds.

## Milestone 7 — Recurring Donations and Restricted Routes
- [ ] Obtain written Razorpay confirmation of Subscriptions + Route account flow and test exact state/webhook model.
- [ ] Implement recurring lifecycle only with explicit donor action, provider-authoritative charges, idempotency, cancellation and reconciliation.
- [ ] Approve FCRA citizenship/source decision tree, recipient permissions and designated bank/provider route before any foreign-source flow.
- [ ] Validate recipient suspension, expired approvals, holds, failed mandates, refunds and reversals.

## Milestone 8 — Future Programs: CSR, Sponsorship, In-Kind Drives
- [ ] CSR: confirm implementing-agency eligibility, CSR-1, Schedule VII/project/reporting and data boundary with qualified reviewers.
- [ ] Cow sponsorship: define animal record provenance, welfare updates, donor privacy, subscription compatibility, cancellation/refund, and certificate wording.
- [ ] Physical donation drives: define moderation, coordinator contact disclosure, pledge/fulfillment states, safety/liability, and no goods/payment guarantee.
- [ ] Obtain separate product/security/legal approval and acceptance tests; none is MVP by default.

## Milestone 9 — Operational Scale and Release Candidate
- [ ] Recalculate dated low/base/high cost scenarios; establish budgets, SLOs and measurable financial invariants.
- [ ] Test backups, point-in-time restore, queue recovery, search rebuild, provider outage, load and failover.
- [ ] Complete threat model, rules/IAM tests, data-flow review, dependency/secret scans, external penetration test and findings disposition.
- [ ] Complete runbooks, incident response, on-call, support/grievance operations, privacy rights and breach drills.
- [ ] Verify accessibility, localization, device performance, app store policies, API compatibility and release rollback.

## Milestone 10 — Production Launch and Monitoring
- [ ] Pass every applicable V2.1 G1–G10 gate with named owner, dated evidence and independent approvals where required.
- [ ] Verify Razorpay production account and exact Route flow in writing; sandbox test reports reconcile without duplicate/missing ledger events.
- [ ] Confirm production IAM/secrets/networking, data retention, backups/restoration, alerts, support and incident response.
- [ ] Obtain formal launch approval; staged rollout, kill switches, monitoring and rollback are tested.
- [ ] Keep foreign contributions, recurring flows, tax issuance, CSR, or other gated scope disabled unless its own gates pass.

No application features, infrastructure resources, or payment integrations were implemented by preparing this tracker. “Production launch” remains blocked until evidence and specialist approvals exist.
