# User Roles

This is a proposed role inventory from V2.0, constrained by V2.1's server-side authorization and tenant-isolation requirements. It is not a complete permission matrix. Approve permissions and data purposes before implementation.

| Principal | Intended scope | Access constraints / status |
|---|---|---|
| Public visitor | View published, active public Gaushala/campaign information and search results. | No access to donor, KYC, payment, unpublished, or private records. Re-check current beneficiary status before offering donation actions. |
| Donor | Manage own account, intents, attempts, donations, subscriptions, receipts, and privacy/support requests. | Authenticate; server derives UID. Cannot write payment status, amount, ledger, tax eligibility, KYC, roles, or counters. A donor may also hold an admin role. |
| Gaushala owner | Manage a specifically assigned Gaushala's approved profile and authorized operational tasks. | Membership must be verified server-side and tenant-scoped. Financial access and team administration require an explicit permission decision. |
| Gaushala editor | Manage specifically assigned content/gallery/update tasks. | No implied financial, donor-identity export, KYC, payout, or membership access. |
| Gaushala viewer | Read explicitly permitted operational/dashboard information for assigned Gaushala(s). | Read-only and tenant-scoped; exact visible fields remain to be approved. |
| Super Admin | Platform operations, review queues, access administration, moderation, support and controlled exception workflows. | Privileged claim is server-managed, not self-assignable; use least privilege, step-up controls, audit, and separation of duties. V2.0's specific PAN access rules need privacy/security approval before adoption. |
| CSR organization user (future) | Manage a corporate program and its own organization/project records. | Separate role and tenant boundary; only eligible projects/beneficiaries after independent CSR-1 and legal verification. Not MVP. |
| Service identity / worker | Perform a narrowly defined backend, webhook, indexing, PDF, or notification operation. | Non-human identity, least-privilege IAM, no user-interactive access, secrets from approved manager, auditable execution. |
| External approver (not a platform role) | Legal counsel, CA, bank, Razorpay, privacy counsel, or security assessor provides written approval/evidence. | No application account implied. Approvals must be recorded with scope, date, and artifact reference. |

## Authorization Rules
- Resolve global Super Admin privileges from server-controlled identity claims and Gaushala roles from a consistent membership model; never trust a client-supplied role or tenant ID.
- Enforce object-level authorization on every backend operation, including list, export, storage, and search actions. Hiding UI controls is not authorization.
- V2.1 notes Admin SDK access bypasses Firestore rules; service-side IAM and explicit authorization remain required.
- Donor identity sharing is purpose-limited. Export permissions, consent/basis, fields, access duration, rate limits, and audit requirements require policy approval.
- Keep finance, KYC, tax, and sensitive account data outside general profile access. Deny by default until rules and tests are reviewed.

## Decisions Still Needed
Approve exact owner/editor/viewer permissions, whether donors can give anonymously or without a full account, Super Admin separation-of-duties, sensitive-data access process, CSR organization roles, account recovery, and support-agent scope. Do not infer these from UI examples in V2.0.
