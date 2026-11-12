# ADR 002: Super Admin Immediate Revocation

- **Status:** Accepted for local Milestone 1.0.3 implementation; production operations pending approval
- **Date:** 2026-11-12
- **Decision owners:** Product owner selected immediate revocation; security and operations approval remains required

## Context

Firestore Rules previously authorized Super Admin reads from the `superAdmin` custom claim alone. Claim removal does not change already-issued ID tokens, so a former Super Admin could retain access until token expiry. Backend callables using Firebase Admin SDK also bypass Firestore Rules and need an independent authorization check.

There is no exported privileged administrative function, production claim-assignment process, or approved audit-log operation in the current repository. The direct-client profile policy remains callable-only; this ADR does not change profile access, membership behavior, or Storage Rules.

## Decision

Every privileged Super Admin access check requires both:

1. The Firebase-verified callable claim is exactly `request.auth.token.superAdmin === true`.
2. The caller's server-managed `super_admin_access/{uid}` document is valid and explicitly has `enabled === true`.

A claim alone never grants Super Admin access. Missing, disabled, malformed, or inaccessible state denies access. Client SDK access to `super_admin_access` is denied for all reads and writes. The backend guard uses the verified callable UID, reads the document through Admin SDK, and returns a generic `permission-denied` result on missing or invalid state and on read failure.

An Admin SDK state-read failure emits the generic log event `super_admin_authorization_state_read_failed` without the UID or state contents. Normal missing, disabled, and malformed states are denied without logging authorization data.

The state document has exactly these fields:

| Field | Type | Policy |
|---|---|---|
| `enabled` | boolean | Only exact `true` grants the state portion of authorization. |
| `updatedAt` | Firestore Timestamp | Set by the trusted Admin SDK process. |
| `updatedBy` | non-empty string | Trusted operator UID or approved actor identifier. |
| `reasonCode` | non-empty string | Non-sensitive, controlled reason code. |
| `version` | positive integer | Incremented for each state transition. |

Unknown or missing fields and invalid types fail closed. No client-callable operation may create or modify this state or assign claims.

## Trusted Operational Sequence

No approved production operator process exists yet. The following is the required design for a future, explicitly approved Admin SDK-only procedure; it is not implemented here.

### Grant

1. Record the approved authorization decision.
2. Create or enable the state document.
3. Assign the `superAdmin` custom claim using a trusted Admin SDK process while preserving unrelated claims.
4. If claim assignment fails, disable the state again and report the failure.
5. Record the action and outcome through the approved audit mechanism.

Both factors are required at every access check. The grant procedure must not report success until both state and claim are in place.

### Revoke

1. Set `enabled = false` and persist that state change.
2. Persist the revocation audit event.
3. Only after state disable succeeds, remove the `superAdmin` claim while preserving unrelated custom claims.
4. Revoke Firebase refresh tokens only when full account reauthentication is separately required.
5. Report partial failure accurately; never restore enabled state to compensate for a failed claim removal.

The first successful state disable immediately denies subsequent Rules-evaluated reads and backend guard checks, even if a previously issued token still contains the claim. It cannot retract data already downloaded, cached offline, or otherwise copied by an authorized user.

## Audit and Failure Handling

The minimum grant/revoke audit event contains actor, target UID, action, server timestamp, non-sensitive reason code, and outcome. Records must be server-controlled and append-only where supported. The existing `audit_log` collection is denied to direct clients, but no production writer, retention policy, operator identity, immutable sink, or approved runbook exists. These must be designed and approved before production use; this ADR does not invent or enable them.

Failure to read authorization state, a missing document, malformed data, or disabled state denies access. During revocation, if state cannot be disabled, the operation must not claim successful revocation or proceed as though access has been removed. Once disabled, later audit or claim-removal failures must leave it disabled and be surfaced as partial operational failure for trusted follow-up.

## Access-check Cost and Limits

Firestore Rules perform an additional lookup of the caller's state document for a Super Admin check. Repeated access to the same path within one Rules evaluation is eligible for Firestore's access-call caching; the check consumes an additional unique document-access call and may incur a document-read charge. It must remain within the applicable Rules document-access call limits (10 for a single document/query request; 20 for multi-operation transactions/batches, in addition to the per-operation limit). The callable guard performs one Admin SDK document read for each guarded operation. No positive authorization result is cached across requests.

## Consequences and Limitations

- There are currently no exported Super Admin operations to use the guard; no handler is added just to expose or test it.
- Super Admin direct-client access remains limited to the already specified Gaushala reads; sensitive collections and authorization-state documents remain inaccessible to clients.
- Owner, Editor, and Viewer membership checks are unchanged. Membership lifecycle is Milestone 1.0.4 and is outside this decision.
- Storage Rules contain no Super Admin grant and are unchanged.
- Admin SDK service IAM, trusted operator authentication/MFA, separation of duties, audit storage/retention, alerts, and incident response remain unverified and require production approval.
- Behavior for disabled or deleted Firebase Auth users and full account deletion remains an unresolved product-owner decision. Any future privileged-account disable/delete workflow must revoke Super Admin state before treating the operation as complete.
- This decision does not establish production readiness or authorize production claims, deployment, or cloud resource changes.

## Verification

Synthetic emulator tests cover valid enabled state, missing/disabled/malformed state, exact claim typing, denial of all direct client state access, and same-session immediate revocation. Backend unit tests exercise the guard with controlled state readers; Functions Emulator tests exercise it against emulator Firestore. These tests do not validate production IAM or an operator/audit workflow.
