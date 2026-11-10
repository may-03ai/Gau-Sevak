# MVP Scope

**Status:** Proposed sandbox MVP for product-owner review. It is deliberately narrower than V2.0's live-money Phase 1. V2.1 controls: no real donations, statutory tax certificates, or foreign contributions before all applicable legal, CA, bank/provider, security, and operational launch gates are evidenced.

## In Scope for the First Testable Slice
- One pilot Gaushala profile with approved public content; no invented production data.
- Flutter donor app baseline, authentication option(s) after identity decisions, profile, and basic donation intent flow.
- Server-side validation of beneficiary status, amount/currency, caller identity, idempotency, and sandbox environment.
- Razorpay sandbox checkout only after the exact sandbox API and merchant setup are approved; otherwise use contract-level tests without a fake provider integration.
- Durable payment-attempt state, webhook verification/idempotency test coverage, non-authoritative client callback handling, and a non-financial Firestore projection.
- Minimal Super Admin review and operational workflow needed to administer the test Gaushala, with explicit audit and least privilege.
- Unit, integration, Firestore/Storage rules, tenant-isolation, duplicate-webhook, amount-manipulation, and error-path tests.
- Development project/emulator separation and documentation of environment-specific configuration.

## Excluded from MVP
- Live donations, real payout/transfer, real donor funds, or production Firebase resources.
- Statutory FN 114 / legacy 10BE certificate issuance; use only clearly labeled test artifacts until a CA approves the applicable tax-year workflow and donee process.
- Foreign-source/FCRA donation support, CSR giving, recurring mandates, cow sponsorship, and physical donation drives.
- Automated legal/tax eligibility claims, production KYC decisions, donor PAN collection, or bank-detail collection in development.
- Scale migration, paid featured listings, BigQuery, Tally/Zoho, WhatsApp Business API, translation automation, or nonessential analytics.

## Proposed Release Sequence
1. **Foundation and sandbox:** resolve specifications and architecture, establish local/emulator workflows, authenticate, show pilot profile, and validate donation intent/payment attempt behavior without live money.
2. **Marketplace beta:** multi-Gaushala onboarding, membership controls, profile moderation, discovery, and admin workflows after security and provider review.
3. **Financially controlled release candidate:** reconciliation, refunds, transfers/settlements, and tax-document flow only in sandbox with finance/CA/provider evidence and full integration tests.
4. **Production launch:** only after all relevant V2.1 launch gates G1–G10 are documented and signed by their owners. No automatic transition from sandbox to production.
5. **Future growth:** CSR, sponsorship, physical drives, advanced campaigns, analytics, and integrations require separate product/legal/security scope approval.

## MVP Acceptance Gates
- Product owner approves one-Gaushala pilot scope, roles, and user-facing language.
- Architecture decisions for Cloud SQL ledger, Firestore projections, durable webhook inbox/worker, and idempotency are reviewed.
- Runtime is pinned to Node 22 per the current project baseline only after verifying Firebase's runtime support and current Google lifecycle status.
- No client can create or mutate financial outcomes; all authorization and totals are server-derived.
- Sandbox test evidence covers duplicate/out-of-order webhooks, retries, amount/currency mismatch, suspended beneficiary, and worker/database failure recovery.
- All tests use synthetic fixtures; no real PAN, bank information, donor PII, or production credentials.
