# Integrations

**Status:** Inventory from the source documents and project brief. Nothing is configured. “Specified” does not mean provider approval, implementation, or legal approval.

| Integration | Intended responsibility | Phase / gate |
|---|---|---|
| Firebase Auth | Donor and admin identity. | MVP candidate; verify OTP/email, recovery, abuse controls and account lifecycle. |
| Firebase Cloud Functions | TypeScript API/orchestration and stateless triggers. | MVP candidate; Node runtime/API compatibility and IAM remain gate items. |
| Firestore | Application state, public profiles, and read projections. | MVP candidate; deny-by-default rules and emulator tests required. |
| Cloud SQL PostgreSQL | Authoritative financial ledger and durable webhook inbox proposal. | Design before payment implementation; CA/accounting and recovery review. |
| Razorpay Route | Sandbox marketplace order/linked-account/transfer flows. | Sandbox only; written approval for exact charitable model and each feature flow before production. |
| Firebase / Cloud Storage | User media and restricted document storage. | Define object authorization, upload scanning, retention, signed-link lifetime and deletion. |
| Cloud Run | Stateless PDF rendering and worker endpoints. | No statutory output until current form and process are CA-approved. |
| Pub/Sub / task queue | Async processing/outbox, retry, and dead-letter handling. | V2.0 proposes Pub/Sub; choose queue and transaction/outbox boundaries in an ADR. |
| Typesense | Derived search index of public Gaushala data only. | Marketplace phase; use managed or durable persistent hosting, not ordinary stateless Cloud Run nodes. |
| Redis-compatible service | Rate limits, short-lived reservations, circuit-breaker lease. | Optional/design decision; V2.1 requires atomic reservation/probe behavior if used. Select provider and assess data region/security. |
| FCM | Best-effort push notifications. | Later MVP/marketplace; verify current Admin SDK API and event semantics. Critical status remains available in server history. |
| SMS provider (V2.0 names MSG91/Kaleyra) | Approved transactional fallback and templates. | Provider undecided; DLT templates/consent and per-environment credentials required. |
| Cloudflare Stream | V2.0 gallery video processing. | Future candidate; assess vendor, data processing, moderation, cost and retention before adoption. |
| Android App Links / iOS Universal Links | First-party deep links with web fallback. | Replace Firebase Dynamic Links, which V2.1 marks deprecated/shut down. Requires controlled domain and platform files. |
| Razorpay Subscriptions | Provider-managed recurring mandates. | Disabled until account-specific Route compatibility is approved in writing and sandbox-tested. |
| Search, tax, accounting, moderation, support and analytics vendors | V2.0 mentions Google Vision/Translation, Zoho/Tally, Freshdesk/Zoho Desk, PagerDuty, Sentry, BigQuery and WhatsApp BSP. | Future/optional. Do not procure or send personal data until product need, contracts, region, retention, access and cost are approved. |

## Contract Requirements
For every adopted integration document: owner and environment; official API/SDK version; auth and secret location; data sent/received and purpose; error/retry/idempotency semantics; rate limits; webhook signature/event ordering; timeout/fallback; retention; monitoring; sandbox test evidence; provider approval and contract. Never invent API fields or copy stale pseudocode without checking the current provider documentation.

## Environment Separation
Development uses emulators/local services and synthetic data; staging uses isolated cloud projects and provider test mode; production uses separate restricted identities, secrets, datasets, provider account/mode and approval workflow. Do not put live keys in app clients, local examples, or development environments.
