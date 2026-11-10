# Product Overview

## Vision
Gau-Sevak aims to help people discover and support eligible Gaushalas through a mobile-first, India-oriented marketplace, while giving beneficiary organizations and platform operators tools to manage profiles, evidence, communications, and financial records.

This is a product direction, not a legal characterization of the platform or a guarantee that every listed organization or donation qualifies for a tax benefit. The legal operator, donee relationship, funds flow, eligibility rules, and donor disclosures remain subject to specialist review.

## Audience and Surfaces
- **Donors:** Flutter mobile app for discovery, giving, donation history, and account/privacy workflows.
- **Gaushala operators:** independent React + Ant Design admin app for onboarding, profile/content operations, and approved reporting.
- **Platform operators:** independent React + Ant Design super-admin app for review, moderation, access administration, support, and reconciliation workflows.
- **CSR organizations:** a possible later, separately scoped portal; not part of MVP and not a promise of CSR eligibility or tax treatment.

## Product Principles
- Start with a small, testable sandbox scope; do not accept live donations until V2.1 launch gates have documented evidence and approvals.
- Keep payment, transfer, settlement, refund, and ledger states distinct and auditable.
- Treat Firestore as application/read-model data and Cloud SQL PostgreSQL as the authoritative financial ledger, as corrected by V2.1.
- Enforce tenant and role authorization on trusted server boundaries; client interfaces are not security controls.
- Minimize donor and beneficiary sensitive data. Collect, disclose, retain, or export only under approved purposes and policies.
- Label verification narrowly: document checks are not an endorsement of a Gaushala's operations.

## Delivery Status
The phase mapping in [`feature-list.md`](feature-list.md) and [`mvp-scope.md`](mvp-scope.md) is a proposed planning baseline derived from the references, not an approved product backlog. V2.0 Phase 1 describes real donations; V2.1 supersedes that launch assumption: initial implementation and payment testing must remain sandbox-only until the applicable launch gates pass.

## Source Basis and Limitations
The V2.0 PDF describes donor, Gaushala admin, super-admin, campaign, CSR, cow sponsorship, and physical-drive concepts. V2.1 is a corrective pack: it controls conflicting legal, financial, security, runtime, integration, and operational requirements but does not restate every V2.0 feature. See [`docs/source/README.md`](../source/README.md) for extraction coverage and limitations. No feature below should be treated as legally approved or already implemented.
