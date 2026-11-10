# Payment Architecture

**Status:** Sandbox-only architecture proposal. No Razorpay account, integration, order, transfer, or live payment is configured. V2.1 controls conflicts with V2.0; provider APIs and account configuration must be checked against current official documentation and written Razorpay approval.

## One-Time Donation: Proposed Flow
1. Authenticated client submits a donation intent and stable idempotency key to a trusted HTTPS function. Backend derives donor UID from verified Firebase Auth, not the request body.
2. Backend validates current beneficiary status/eligibility, amount/currency, configured limits, tenant state, and applicable donor/cause gates. Reject if a required approval or beneficiary account state is absent.
3. Persist/reuse a payment attempt before creating the provider order. A retry is a separately auditable attempt; do not overwrite an earlier provider order/payment ID.
4. Create only a sandbox Razorpay order using the documented Route flow confirmed for the account. Client checkout success is a UX signal, never authoritative capture evidence.
5. Receive webhook, verify HMAC over the exact raw body with the configured secret, require documented event identity, and durably insert into a unique provider/account/environment/event inbox before returning 2xx.
6. Process asynchronously and idempotently: validate provider account, event type, order/payment references, amount and currency; append ledger effect; update Firestore projection; publish an outbox event for notifications/documents.
7. Process transfer and settlement independently from their authoritative provider events/reports. Reconcile capture, transfer, settlement, fees, refunds and reversals.

Do not invent Razorpay headers, timestamp validation, API fields, transfer timing or settlement guarantees. V2.1 specifically rejects a made-up signed timestamp and Firestore SQL-style uniqueness. Confirm exact SDK/raw-body support and current API behavior before implementation.

## State and Idempotency
Keep intent, payment attempt, provider payment, transfer, settlement, refund and dispute states separate; preserve both provider state and normalized internal state. Every mutating request/event has an idempotency strategy. Duplicate event IDs must not repeat effects. Use append-only ledger events and linked reversals. `captured` does not mean transferred or settled.

## Refunds, Holds, and Recurring Flows
- Refund decision policy, timelines, fees, post-settlement recovery, transfer reversal, chargeback evidence, and suspension handling require counsel, beneficiary, finance and provider approval. Do not adopt V2.0's universal seven-day refund promise or “platform escrow” language.
- On suspension, define how new intents, pending transfers, subscriptions, search visibility, donor communications, and held funds are handled with provider-supported behavior. Do not promise a clawback or resume until verified.
- Recurring donations remain disabled until Razorpay confirms the exact Route + Subscriptions combination, charge/transfer sequence, retry lifecycle, mandate controls, and webhook set in writing. Schedulers must not independently charge on provider-managed due dates.
- Foreign contributions, FCRA routes, and CSR donations are excluded from MVP and blocked until the relevant legal, bank, provider, and recipient approvals are recorded.

## Financial Controls and Testing
Use integer paise and explicit currency. Require sandbox tests for duplicate/out-of-order/delayed webhooks, callback ordering, amount mismatch, payment retry, worker crash, missing Firestore projection, failed/pending/reversed transfer, full/partial/repeated refund, suspension races, reconciliation and provider outage. Production acceptance also requires V2.1 launch-gate evidence; this document is not legal or provider approval.
