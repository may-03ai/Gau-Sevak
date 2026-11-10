# Firebase Security Rules Test Plan

**Status:** Local emulator tests executed on 2026-11-10 with portable Node.js 22.23.4. This verifies Firebase Security Rules behavior in the configured emulators; it is not a production security assessment, backend authorization test, or legal approval.

## Test Command
From the repository root in PowerShell:

```powershell
.\infra\scripts\run-local-tests.ps1 -TestCommand "node --test tests/security/security.rules.test.js"
```

The helper starts Auth, Firestore, Functions, and Storage with `--project demo-gau-sevak`, selects portable Node 22, runs the test file, and shuts the emulator processes down. Fixtures use synthetic identifiers/data and `withSecurityRulesDisabled` only for seeding test records/files.

## Results
| Area | Executed | Passed | Failed |
|---|---:|---:|---:|
| Firestore | 19 test cases | 19 | 0 |
| Storage | 4 test cases | 4 | 0 |
| Total | 23 test cases | 23 | 0 |

Firebase SDK `PERMISSION_DENIED` log lines are expected for assertions that verify denials; the Node test runner reported all 23 cases passing and the emulator process exited successfully.

## Firestore Coverage
- Unauthenticated reads of private user, donation, and certificate records are denied.
- Active Gaushalas are public; suspended Gaushalas are hidden from public users.
- Active campaigns and approved updates are public; drafts and pending updates are not.
- Users can read their own profiles, not another user's; profile allowlists reject PAN/KYC/role/claim modifications.
- Self-profile creation succeeds with only the allowlisted fields; an attempted role field is denied.
- Donors can read only their own donations, subscriptions, certificates, refund requests, and notifications; direct financial writes are denied.
- Donor queries must include an ownership constraint; unfiltered donation collection queries are denied.
- Membership reads are self-scoped; fake membership creation is denied.
- Owner, Editor, and Viewer boundaries are tested for Gaushala reads, update creation, and payouts; revoked membership and cross-tenant draft/payout/membership access are denied.
- A `superAdmin: true` test claim permits the policy-approved all-Gaushala read; ordinary users are denied suspended-Gaushala reads. Direct sensitive collection access remains denied even with the claim.
- Refund creation/modification, moderation changes, audit/webhook/config writes, notification field updates other than boolean `read`, and all unlisted collections are denied to clients.

## Storage Coverage
- Published-and-approved public media is readable; pending media and all client writes to the public prefix are denied.
- Donors can read their own certificate/export objects, not another user's; direct writes are denied.
- KYC objects deny direct reads/writes, including authenticated Gaushala Owners.
- Staging uploads require an active Owner/Editor membership matching both Gaushala and uploader UID; Viewer, revoked member, cross-Gaushala path, mismatched uploader, disallowed MIME type, and oversized file are denied.
- Storage Rules use Firestore `get`/`exists` for membership validation. This was exercised in the local Storage and Firestore emulators.

## Limitations and Open Decisions
- Membership lifecycle and Super Admin custom-claim assignment are trusted backend operations; no such backend function exists in this scaffold. Tests inject claims through the Rules Unit Testing context, so they verify claim enforcement, not the Admin SDK claim-setting workflow.
- The 10 MiB image staging limit is provisional because the approved policy specified MIME/size validation but no numeric image maximum. Obtain product-owner confirmation before production use.
- Public moderation/publication metadata must be written by a trusted backend. Tests seed published objects with rules disabled to verify read policy; no publishing endpoint is implemented.
- Direct KYC/certificate/export writes remain denied. Short-lived backend-authorized upload/download endpoints are not implemented or tested here.
- Firebase documents that Storage-to-Firestore rule lookups require service permission when deployed. This milestone did not create cloud resources or validate deployed IAM permissions.
- These are client Security Rules tests only. They do not test Cloud Functions/Admin SDK authorization, token issuance, service IAM, App Check, API rate limits, SQL access, external penetration, or production configuration.
- No real PAN, bank details, credentials, or production data were used. No deployment or cloud resource creation occurred.

See [`../architecture/firestore-access-matrix.md`](../architecture/firestore-access-matrix.md) and [`../architecture/storage-access-matrix.md`](../architecture/storage-access-matrix.md) for the approved policy mapping.
