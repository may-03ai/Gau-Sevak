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
- [ ] Security, privacy, payments, finance/CA, and legal owners confirm their decision backlog.

### 0.3 Local Development Environment and Firebase Emulator Foundation — In review (owner review pending)
- [x] Audit Windows, Flutter, Dart, Android SDK, Java, Node.js, npm, Git, and Firebase CLI versions.
- [x] Verify Firebase CLI exists; skip global installation because version 15.35.0 is present.
- [x] Verify Node 22 runtime support and upstream lifecycle; record EOL and upgrade requirement.
- [x] Verify bundled JDK 21, Java PATH state, and Firebase Emulator Suite Java requirement.
- [x] Configure demo-only project, loopback emulator ports, existing rules/index paths, and helper scripts.
- [x] Add local setup and troubleshooting runbook; preserve deny-all rules.
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

### 0.5 Specialist and owner decisions — Blocked on approval
- [ ] Obtain legal funds-flow / PA classification and provider-approved Route model.
- [ ] Confirm donee eligibility, tax reporting/certificate ownership, accounting and ledger policy with CA/donee.
- [ ] Confirm FCRA/foreign donation policy and DPDP commencement/roles/retention with specialists.
- [x] Confirm the Firebase runtime guide lists Node 22 and record official Node upstream EOL as 2027-04-30.
- [ ] Re-check Google Cloud's specific runtime decommission schedule before any cloud deployment.
- [ ] Approve environments, regions, IAM, state, budgets, data boundaries, and support/incident ownership.

### 0.6 Development workstation and CI baseline — Not started
- [ ] Decide supported Windows baseline and Android/iOS build targets.
- [ ] Resolve Android license state; install Visual Studio C++ workload only if Windows desktop builds are required.
- [ ] Initialize Git and choose package managers/tool version pinning after architecture approval.
- [ ] Define CI jobs, secret scanning, dependency scanning, format/lint/type/test gates, and emulator strategy.

## Milestone 1 — Secure Development Foundations
- [ ] Create approved dev-only Firebase project/emulator configuration; do not create production resources.
- [ ] Establish independent mobile, backend, Gaushala Admin, and Super Admin build/test workflows.
- [ ] Define versioned framework-neutral API contracts and strict TypeScript/Dart analysis.
- [ ] Define Firebase Auth configuration, role/membership source, and service identities without broad grants.
- [ ] Add fail-closed rule tests, synthetic fixtures, local secrets guidance, and audit/logging baseline.

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
