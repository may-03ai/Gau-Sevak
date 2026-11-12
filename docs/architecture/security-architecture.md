# Security Architecture

**Status:** Baseline principles from V2.1; not a completed threat model, legal assessment, or security approval. Existing Firestore and Storage rules deny access by default. Do not loosen them until policy, schema, and tests are reviewed.

## Identity and Authorization
- Firebase Auth provides identity; callable handlers derive UID from Firebase's verified `request.auth` context rather than parsing JWTs. Super Admin authorization requires both `superAdmin === true` and an explicitly enabled, valid `super_admin_access/{uid}` document. A token claim alone is never sufficient; missing, malformed, disabled, or unavailable state denies access.
- Enforce role, tenant, object, operation, and purpose at backend boundaries on every request. Define owner/editor/viewer and support roles before exposing admin APIs.
- Clients cannot set account status, PAN, KYC, role, donation/payment state, amounts, financial totals, verification badges, or refund decisions.
- Firestore rules protect direct client access only. Cloud Functions using Admin SDK bypass rules and need explicit authorization, input validation, and least-privilege service IAM. Apply corresponding controls to Storage and Cloud SQL.

## Data Protection
- Classify donor identity, tax/KYC data, beneficiary banking data, financial events, public content, analytics, and operational logs separately.
- Minimize collection and use; never store card PAN/CVV, OTPs, or unnecessary sensitive payment data. Keep PAN/bank information out of general profile collections and logs; exact need, legal basis, encryption, key custody and retention require approved policy.
- Store secrets in an approved secret manager, separated by environment and service identity; rotate and audit access. No secrets in clients, source control, `.env.example`, or logs.
- Restrict signed URLs to short duration; define object retention independently. Use unguessable certificate IDs, anti-enumeration, rate limits and minimal public verification responses.
- Establish a record-class retention and deletion schedule, legal-hold process, consent/purpose evidence, rights workflow, processor contracts, grievance channel and breach process against the DPDP commencement schedule. V2.0's blanket localization, deletion and retention claims are superseded; do not present alternatives as legal advice.

## Tenant and Financial Isolation
- Prove donor self-access and cross-user denial; prove every Gaushala admin is isolated from other tenants across reads, queries, exports, storage, search, support and backend jobs.
- Keep the SQL ledger append-only for application roles; only controlled service paths may post entries. Use unique source references and transactional balance checks once accounting policy is approved.
- Require purpose-limited donor exports with authorization, lawful basis/consent, minimum fields, watermark/expiry where approved, audit events and rate limits.

## Security Verification Gates
Threat model; rules/IAM tests; mass-assignment and IDOR tests; secret/dependency scans; webhook signature and replay/idempotency tests; privacy/logging review; backup restore; incident and provider-outage drills; external penetration test; closure or formally accepted disposition of critical/high findings. V2.1 release status must be evidence-based (Not assessed, Designed, Implemented, Tested, Independently approved, Production monitored), never a self-awarded numeric score.

## Emulator Rule Baseline (2026-11-10)
The approved direct-client Firestore contract is recorded in [`firestore-access-matrix.md`](firestore-access-matrix.md); the Storage path contract is in [`storage-access-matrix.md`](storage-access-matrix.md). The corresponding rules point to the demo-only emulator project and use explicit collection/path grants followed by recursive deny rules. Super Admin Rules checks perform a state-document lookup; there is no cross-request cache, and previously downloaded or offline-cached data cannot be revoked.

Local Rules Unit Testing executed **26/26 passing** under Node 22.23.4: 22 Firestore tests and 4 Storage tests. Details and limits are in [`../testing/security-rules-test-plan.md`](../testing/security-rules-test-plan.md). The result is emulator evidence only; it is not production approval.

Remaining implementation boundaries: trusted backend functions for membership lifecycle, custom-claim assignment, Super Admin state provisioning/revocation, moderation/publication metadata, and private KYC/certificate/export upload/download are not present. The reusable `requireActiveSuperAdmin` guard has no exported privileged handler. No production claim assignment or deployment occurred; Admin SDK bypass and deployed service IAM need separate review. The minimum audit event is documented, but no approved production audit writer, operator procedure, or retention policy exists. Storage's 10 MiB staged-image cap is provisional pending product-owner confirmation; Storage-to-Firestore cross-service IAM has not been configured or verified in a cloud project.
