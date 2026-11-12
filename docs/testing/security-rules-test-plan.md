# Firebase Security Rules Test Plan

**Status:** Local emulator tests executed on 2026-11-12 with portable Node.js 22.23.4. This verifies Firebase Security Rules behavior in the configured emulators; it is not a production security assessment, backend authorization test, or legal approval.

## Test Command
From the repository root in PowerShell:

```powershell
.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"
```

The helper starts Auth, Firestore, Functions, and Storage with `--project demo-gau-sevak`, selects portable Node 22, runs the test file, and shuts the emulator processes down. Fixtures use synthetic identifiers/data and `withSecurityRulesDisabled` only for seeding test records/files.

## Results
| Area | Executed | Passed | Failed |
|---|---:|---:|---:|
| Firestore | 22 test cases | 22 | 0 |
| Storage | 4 test cases | 4 | 0 |
| Total | 26 test cases | 26 | 0 |

Firebase SDK `PERMISSION_DENIED` log lines are expected for assertions that verify denials; the Node test runner reported all 26 cases passing and the emulator process exited successfully.

## Firestore Coverage
- Unauthenticated reads of private user, donation, and certificate records are denied.
- Active Gaushalas are public; suspended Gaushalas are hidden from public users.
- Active campaigns and approved updates are public; drafts and pending updates are not.
- Clients cannot read, list, create, update, or delete user profiles; profile CRUD is callable-only. Profile input allowlists and backend ownership behavior are covered by the separate Functions tests.
- Donors can read only their own donations, subscriptions, certificates, refund requests, and notifications; direct financial writes are denied.
- Donor queries must include an ownership constraint; unfiltered donation collection queries are denied.
- Membership reads are self-scoped; fake membership creation is denied.
- Owner, Editor, and Viewer boundaries are tested for Gaushala reads, update creation, and payouts; revoked membership and cross-tenant draft/payout/membership access are denied.
- A `superAdmin: true` test claim plus valid enabled state permits the policy-approved restricted Gaushala read; ordinary users are denied suspended-Gaushala reads. Direct sensitive collection access remains denied even with both factors.
- Restricted Super Admin reads require both the exact true claim and a complete, enabled `super_admin_access/{uid}` state document. Missing, disabled, malformed state, false/null/wrong-type claims are denied.
- Clients, including Super Admin claim contexts, cannot read/list/create/update/delete authorization-state documents.
- Immediate-revocation regression creates a unique synthetic account through Auth Emulator Admin SDK with only the `superAdmin: true` custom claim, signs in through Firebase Auth client SDK, and verifies the emulator-issued ID token's UID and claim. It uses one authenticated client session and Firestore instance: the restricted server read succeeds with enabled state, trusted Admin SDK setup disables the state, and the same unchanged token is confirmed immediately before and after the second server read, which Rules deny. It does not refresh or reauthenticate between reads; cleanup signs out, deletes the app, removes both Firestore fixtures, and deletes only the synthetic Auth user.
- Refund creation/modification, moderation changes, audit/webhook/config writes, notification field updates other than boolean `read`, and all unlisted collections are denied to clients.

## Storage Coverage
- Published-and-approved public media is readable; pending media and all client writes to the public prefix are denied.
- Donors can read their own certificate/export objects, not another user's; direct writes are denied.
- KYC objects deny direct reads/writes, including authenticated Gaushala Owners.
- Staging uploads require an active Owner/Editor membership matching both Gaushala and uploader UID; Viewer, revoked member, cross-Gaushala path, mismatched uploader, disallowed MIME type, and oversized file are denied.
- Storage Rules use Firestore `get`/`exists` for membership validation. This was exercised in the local Storage and Firestore emulators.

## Limitations and Open Decisions
- Membership lifecycle, Super Admin custom-claim assignment, authorization-state grant/revoke operations, and production audit writing are trusted backend/operations responsibilities; no such production function or operator process exists in this scaffold. General Rules fixtures inject claims and state through Rules Unit Testing's disabled-rules setup. The dedicated revocation regression separately uses a real Auth Emulator client session and seeds/disables state through trusted Admin SDK setup. Neither validates a production claim/state management workflow.
- The 10 MiB image staging limit is provisional because the approved policy specified MIME/size validation but no numeric image maximum. Obtain product-owner confirmation before production use.
- Public moderation/publication metadata must be written by a trusted backend. Tests seed published objects with rules disabled to verify read policy; no publishing endpoint is implemented.
- Direct KYC/certificate/export writes remain denied. Short-lived backend-authorized upload/download endpoints are not implemented or tested here.
- Firebase documents that Storage-to-Firestore rule lookups require service permission when deployed. This milestone did not create cloud resources or validate deployed IAM permissions.
- These are client Security Rules tests with a local Auth Emulator session for the revocation regression. The test verifies a local emulator-issued token and subsequent online Rules evaluation against changed server-managed state; it does not revoke data already downloaded or offline cached. It does not validate production token/claim administration, IAM, or operations. Rules tests do not test Cloud Functions/Admin SDK authorization, service IAM, App Check, API rate limits, SQL access, external penetration, or production configuration.
- No real PAN, bank details, credentials, or production data were used. No deployment or cloud resource creation occurred.

See [`../architecture/firestore-access-matrix.md`](../architecture/firestore-access-matrix.md) and [`../architecture/storage-access-matrix.md`](../architecture/storage-access-matrix.md) for the approved policy mapping.
