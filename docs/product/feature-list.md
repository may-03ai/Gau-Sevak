# Feature List

This is a traceable candidate feature inventory from V2.0, corrected by V2.1. It is not an approved or implemented backlog. **MVP** means the proposed first product slice; **future** means explicitly later or gated scope. No live-money feature is launchable until the applicable V2.1 gates are evidenced.

## Donor App
### MVP candidate, sandbox-first
- Account sign-in and profile completion; V2.0 proposes phone OTP and Google sign-in. Provider delivery, recovery, required profile fields, notices, and consent need validation.
- View a single pilot Gaushala profile and its approved public information.
- Create a donation intent with amount/category; server derives identity, validates current beneficiary state and amount, and creates a sandbox checkout attempt.
- View payment-attempt status, donation history, and a non-statutory sandbox receipt/status record.
- Basic account settings and support/contact path, subject to approved privacy and support processes.

### Marketplace and later candidates
- Search, location/filter discovery, public profiles, campaigns, updates, sharing, and notifications.
- Multiple payment attempts per intent; user-visible pending/failed/retry states; offline browsing only. Payment initiation still requires connectivity.
- Recurring giving through Razorpay Subscriptions only after Route compatibility and the account-specific flow are approved and tested.
- Donation history, refund requests, privacy rights workflows, and notices/consent as finalized by counsel.
- Statutory tax certificate workflow only after current tax-year form, donee eligibility, filing responsibility, and sample are approved by a CA and relevant authorities. Do not copy V2.0's universal Form 10BE/PAN assumptions.

## Gaushala Admin
### Marketplace phase candidate
- Submit and maintain a Gaushala profile and onboarding application.
- Upload required documents through an access-controlled flow; see document review state, expiry, and remediation requests.
- Manage approved profile content, gallery, updates, and campaigns subject to moderation/approval.
- View scoped donation, transfer, settlement, refund, and reporting information only where explicitly authorized.
- Export donor/tax data only for a documented purpose, after lawful basis/consent review, with server-side scope checks, audit, expiry, and rate limits.
- Manage team membership according to an approved owner/editor/viewer permission matrix.

## Super Admin
- Review Gaushala applications and documents; approve/reject with reasons and audit records.
- Manage role assignments, suspension/reactivation, content and campaign moderation, and support escalations.
- Review payment exceptions, refund requests, disputes, transfers, settlements, and reconciliation evidence under least privilege.
- Access sensitive identity/tax data only through a separately approved, audited, narrowly scoped workflow; no blanket export is implied.
- View operational metrics and perform controlled configuration/incident actions with approval and change history.

## Future Features, Not MVP
- **CSR portal:** separate corporate organization, project, eligibility, and reporting path. CSR-1 and implementing-agency eligibility require independent verification; 80G status alone is not sufficient (V2.1, pp. 6, 14–16).
- **Cow sponsorship/adoption:** public cow profiles, sponsorship, updates, and commemorative certificates; future concept from V2.0 Part 42. Do not promise recurring billing or tax treatment until separately approved.
- **Physical donation drives:** in-kind needs, donor pledges, and coordination; future V2.0 Part 43 concept. Logistics, liability, identity disclosure, and tax valuation require policy/legal review. The platform must not imply it processes or guarantees delivery.
- Additional languages, festival campaigns, accounting integrations, richer analytics, and scale/migration work, subject to prioritization and privacy/security review.

## Conflicts to Resolve Before Backlog Approval
- V2.0 assigns features to Phases 1–4 but also declares all requirements Day 1; V2.1 says it is only a correction pack. This document proposes phasing, not a source rewrite.
- V2.0 Phase 1 says production donations and tax certificates. V2.1 blocks real money and statutory certificates until specialist/provider gates pass.
- Features involving foreign contributions, tax data, CSR, donor exports, refunds, and subscriptions remain gated; see [`../implementation/technical-decisions.md`](../implementation/technical-decisions.md).
