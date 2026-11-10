# Database Design

**Status:** Logical responsibilities are source-backed; schemas below are a proposed baseline, not migrations or approved production DDL. V2.1 overrides V2.0's partitioned-ledger design.

## Data Ownership
| Store | Responsibility | Authority |
|---|---|---|
| Firestore | User-facing profiles, onboarding/workflow state, content, memberships, and read projections. | Application state authority for its approved domains; not financial truth. Public profile status must be rechecked at action boundaries. |
| Cloud SQL PostgreSQL | Authoritative financial records, durable webhook inbox/idempotency keys, accounting events, reconciliation and controlled financial queries. | V2.1 names Cloud SQL as financial source of truth. Use transactions, constraints and restricted roles. |
| Firebase/Cloud Storage | Uploaded media and generated artifacts. | Object store; authorization and retention must be independent of link expiry. No local filesystem as durable storage. |
| Typesense | Searchable subset of approved public Gaushala fields. | Derived/rebuildable index; Firestore remains public-profile source. Never index donor or sensitive data. |

## Candidate Financial Entities
- `donation_intents`: stable business intent, authenticated donor reference, beneficiary, purpose and requested amount/currency.
- `payment_attempts`: append one record per checkout/order retry; retain provider order IDs and normalized/provider states separately.
- `provider_payments`: provider payment ID, captured amount/currency/method/state; enforce provider/account/environment uniqueness.
- `transfers` and `settlements`: separate beneficiary transfer and bank settlement lifecycles; do not equate capture, transfer, and settlement.
- `refunds` / `reversals`: provider references, reason, amounts, state and links to original payment/transfer and ledger events.
- `ledger_events`: append-only financial events with unique source references; corrections are linked reversal/new events, never mutation of posted history.
- `provider_webhook_events`: durable unique inbox keyed by provider, account, environment and event ID, with processing/retry/error timestamps. Persist before acknowledging webhook.
- `audit_events`: append-only security and operational actions with minimized metadata and controlled reader access.

V2.1 recommends an unpartitioned ledger initially. Store monetary values as integer paise with explicit currency; never use floating point. A CA/accounting architect must define chart of accounts, balanced debit/credit batches, recognition/posting dates, fees, GST/TDS treatment, liabilities, reconciliation and correction policy before real-money processing.

## Consistency and Security
- Commit durable financial inbox/event state before asynchronous acknowledgement or retry. Define how SQL transactions, outbox messages, and Firestore projections recover from partial failure; do not claim cross-database atomicity.
- Treat Firestore as a projection for client reads. Clients cannot create/update payment outcomes, ledger data, role claims, KYC status, totals, or audit records.
- Firestore and Storage rules must deny by default until the schema and tests are approved. Admin SDK bypasses rules; protect it with service IAM and explicit tenant/object checks.
- Use scoped SQL roles, private networking, secret-managed credentials, backup/restore tests, and an approved retention/legal-hold schedule.
- Avoid putting full webhook payloads, PAN, bank details, OTPs, card data, or unnecessary PII in logs or event storage. If payload retention is necessary, minimize, encrypt, restrict, and time-limit it.

## Indexing, Partitioning, and Migration
Derive Firestore indexes from reviewed query patterns and test rules/query constraints. Start SQL unpartitioned; add indexes from measured workloads. Partition only after volume evidence, migration plan, retention/archive design, and uniqueness strategy account for partition keys. Keep schema migrations versioned and backward-compatible; rollback strategy must account for irreversible financial events.

## Open Schema Decisions
Canonical IDs across Firestore/SQL, account mapping, ledger balancing, donor pseudonymization, row-level tenant access, time/financial-year basis, retention and deletion, archival, migration tooling, and source-of-truth ownership for status fields remain unresolved. Do not create live financial records before these are approved.
