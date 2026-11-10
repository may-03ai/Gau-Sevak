# Firestore Access Matrix

**Status:** Approved access model supplied for Milestone 0.4; implementation below maps it to direct client Security Rules. Server/Admin SDK access is a separate trusted boundary and must authorize every action, because Admin SDK bypasses these rules. V2.1 overrides conflicting V2.0 statements.

## Identity and Membership Contract
- Signed-in identity is `request.auth.uid`; clients cannot choose the acting UID or role.
- Super Admin claim is the boolean custom claim `superAdmin == true`; only Firebase Admin SDK may set it. It is not a Firestore user field.
- Membership document ID is `{userId}_{gaushalaId}` in `gaushala_admins`; approved membership field is spelled `gaushalId`. Required fields: `userId`, `gaushalId`, `role` (`owner|editor|viewer`), `status` (`active|revoked`), `createdBy`, `createdAt`.
- A membership is effective only if the deterministic document exists and its UID, Gaushala ID, role, and `status == active` match the request. Client writes to membership documents are always denied; trusted Super Admin backend operations create/change/revoke memberships.
- Unlisted collections and unmatched documents are denied by the final recursive rule.

## Collection Matrix
| Collection | Public / unauthenticated | Donor or ordinary user | Assigned Gaushala membership | Super Admin direct client |
|---|---|---|---|---|
| `gaushalas/{gaushalaId}` | Read active documents only. | Same public active read. | Read own assigned Gaushala regardless of operational status. | Read any Gaushala. |
| `users/{userId}` | Denied. | Read self. Create self with allowlisted profile fields; update only `name`, `email`, `locale`, `notificationPreferences`. No client role, PAN, KYC, account-status, or financial fields. | No additional access. | No additional direct access. |
| `gaushala_admins/{userId}_{gaushalaId}` | Denied. | Read own membership only (`resource.data.userId == auth.uid`). No create/update/delete, including Super Admin clients. | No additional client access. | Membership management only through authorized backend functions; direct rule access remains self-read only. |
| `donations/{donationId}` | Denied. | Donor may read records whose `userId` is self. | No direct access to donor PII or donation documents. | Backend access only; no direct client access specified. |
| `subscriptions/{subscriptionId}` | Denied. | Donor may read own records. | No direct record access; analytics through authorized backend API. | Backend access only. |
| `campaigns/{campaignId}` | Read when `status == active`. | Same public read. | Read campaigns for assigned Gaushala. | No additional direct access specified; use authorized backend for administrative operations. |
| `updates/{updateId}` | Read when `status == approved`. | Same public read. | Assigned Owner/Editor may read own Gaushala updates and create only `pending_moderation`; Viewer is read-only. No client update/delete. | Moderation through trusted backend; no direct client mutation. |
| `tax_certificates/{certificateId}` | Denied. | Donor may read own records. | Denied. | Sensitive access through authorized backend only. |
| `payouts/{payoutId}` | Denied. | Denied. | Assigned Owner may read own Gaushala payouts; Editor/Viewer denied. | Through authorized backend only. |
| `refund_requests/{requestId}` | Denied. | Donor may read own requests; create/update/delete via backend only. | Denied. | Through authorized backend only. |
| `notifications/{notificationId}` | Denied. | Read own; update only boolean `read`; no create/delete. | Denied unless the user is also the notification owner. | No additional direct access specified. |
| `gaushala_sensitive`, `gaushala_kyc_documents`, `audit_log`, `webhook_events`, `platform_config` | Denied. | Denied. | Denied. | Denied to direct client SDK; trusted backend only. |

## Field and Query Constraints
- User create allows only the reviewed basic profile fields (`name`, `email`, `locale`, `createdAt`); updates may change only `name`, `email`, `locale`, and `notificationPreferences`. Additions such as `role`, `superAdmin`, PAN, KYC, account state, donation totals, or payment state must fail.
- Update creation fields are restricted to the content schema; `authorId` must match auth UID, `gaushalId` must match the path, and initial status must be `pending_moderation`. Moderation fields and later updates are server-managed.
- Client queries must satisfy the same ownership/status predicates as document reads; tests use direct document and query attempts where applicable.
- Firebase client access checks do not constrain Admin SDK. Functions must independently validate token, custom claims, membership, tenant, object, operation, and allowed fields.

## V2.1 Alignment and Open Implementation Detail
The approved policy intentionally narrows V2.0 Part 4.3's broad Super Admin/user reads, V2.0 Part 8's broad administrative access, and V2.0's membership/KYC read patterns. It follows V2.1 least privilege, server-side authorization, Firestore/Admin SDK bypass warnings, and tenant-isolation expectations. The deterministic membership ID and role-specific owner/editor/viewer checks follow the approved contract and V2.1's membership-lookup correction. The profile field allowlists follow V2.1's example pattern. Whether Super Admin should directly read any collection not explicitly granted here remains intentionally backend-only until separately approved.
