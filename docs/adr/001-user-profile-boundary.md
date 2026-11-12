# ADR 001: User Profile Ownership and Access

- **Status:** Accepted for Milestone 1.0.2 implementation; platform-wide email policy confirmation pending
- **Date:** 2026-11-12
- **Decision owners:** Backend implementation; project-owner confirmation required for platform-wide policy

## Context

Milestone 1.0.2 adds a minimal user profile while the repository has no production backend deployment. Firebase callable authentication provides a verified caller context. Firebase Admin SDK bypasses Firestore Security Rules, so profile handlers must enforce ownership and input policy themselves. V2.1 requires allowlists for self-service fields and forbids client control of account status, PAN, KYC, balances, donation counts, admin roles, and verification badges. V2.1 also replaces V2.0's last-three-donations recovery method.

## Decision

1. Firebase Auth is the authoritative identity source. Every profile document is `users/{request.auth.uid}`; request data never selects a UID.
2. `name`, `email`, `locale`, `notificationPreferences`, `createdAt`, and `updatedAt` are the persisted profile fields. No flat role is stored in this document. Super Admin claims and Gaushala memberships remain separate.
3. Firebase Admin Auth is the canonical source for current email and verification state; email is never accepted from callable data. Initial profile creation in Milestone 1.0.2 requires a non-empty verified Auth email. A verified Auth email is transactionally synchronized when a profile is provisioned again, retrieved, or updated. An unverified or missing Auth email does not overwrite the stored snapshot and is always returned as `email: null`, `emailVerified: false`. A legacy stored email is not trusted without current Auth verification.
4. `emailVerified` is derived response metadata, not a persisted field or client-editable profile value. Email returned by the API is the current verified Firebase Auth email; stored legacy/stale values are never presented as verified or used for authentication, recovery, notification delivery, or tax-related operations.
5. Client-editable fields are limited to validated `name`, `locale` (`en`/`hi`), and `notificationPreferences` (`campaign_update` boolean only). All other fields, including UID, email, email verification state, roles, status, PAN/KYC, balances, counters, badges, and timestamps, are rejected.
6. `campaign_update` defaults to `false`. This preference is not marketing consent and does not trigger FCM/SMS.
7. Callable APIs are the only client route for profile create, get, and update. Direct client reads, listing, creates, updates, and deletes of `users/{uid}` are denied by Rules. Admin SDK operations independently authenticate, validate, and scope access to the caller's document.
8. Creation is transactional and duplicate-safe. Missing-profile get/update operations return `not-found`; update never silently creates.
9. API timestamps are serialized as ISO-8601 strings. Internal errors are returned generically and logs do not include profile data or email.

The verified-email gate is a Milestone 1.0.2 implementation policy, not an automatically approved permanent policy for all future product workflows. Product-owner confirmation is required before treating it as platform-wide.

## Consequences

- The mobile client must use the callable API instead of direct Firestore profile access.
- Existing clients that rely on direct profile reads/writes must migrate before deployment.
- The current verified-email requirement blocks initial profile creation for phone-only or unverified-email accounts until the account's email is verified; product owners must confirm whether this policy applies platform-wide and preserve an appropriate verification UX.
- Existing or legacy profile email snapshots are not independently trusted. If Firebase Auth has no currently verified email, the API returns null email metadata while retaining otherwise valid profile access.
- These decisions do not implement account recovery, role management, membership, notification delivery/consent, or financial/KYC data workflows.

## Verification

Validate the rules-only client boundary separately from the callable emulator tests. Callable tests must exercise the Admin SDK path because Admin SDK writes bypass Firestore Rules. No production deployment or IAM verification is implied.
