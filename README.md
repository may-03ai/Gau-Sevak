# Gau-Sevak

Gau-Sevak is planned as a multi-Gaushala donation marketplace for India. This repository currently contains a project scaffold and planning documentation only. It does not contain a working application, configured service, live payment integration, or deployed infrastructure.

## Project Goals
- Provide distinct mobile and administrative experiences for the approved user roles.
- Support multiple Gaushalas through clearly bounded, independently maintainable applications and backend domains.
- Keep financial ledger responsibilities auditable and separate from general application data.
- Establish security, privacy, operational, and compliance requirements before implementing sensitive workflows.

These are high-level goals only. The V2.0 Master System Prompt and corrective V2.1 pack are now available in `docs/source/` and were text-extracted for documentation review. V2.1 overrides conflicts but does not replace V2.0's full product scope. Do not treat unresolved requirements or assumptions as approved.

## Technology Stack
- Mobile: Flutter, Dart, Riverpod.
- Admin panels: two independently maintainable React + TypeScript applications using Ant Design.
- Backend: Firebase Cloud Functions + TypeScript; Firestore for application data; Firebase Auth for authentication.
- Financial ledger: PostgreSQL.
- Marketplace payments: Razorpay Route. No live integration is configured.
- PDF generation: Cloud Run.
- Infrastructure: Terraform.
- Node.js runtime: Node 22 is the Firebase Functions baseline per V2.1 and current Firebase runtime documentation. The official Node schedule lists upstream EOL as 2027-04-30; plan an upgrade before then. A portable Node 22.23.4 runtime is installed under user AppData and selected by local emulator scripts; global Node 24 remains unchanged.

## Repository Structure
- `.github/`: repository-wide Copilot guidance, scoped instructions, and workflow placeholder.
- `apps/mobile/`: Flutter mobile application boundary.
- `apps/admin-gaushala/`, `apps/admin-super/`: separate React admin application boundaries.
- `backend/functions/`: domain-organized Cloud Functions placeholder.
- `backend/pdf-service/`: isolated Cloud Run PDF service placeholder.
- `packages/shared-types/`, `api-contracts/`, `documentation/`: reusable, framework-neutral sharing boundaries.
- `infra/firebase/`, `infra/terraform/`, `infra/scripts/`: security-rule placeholders and infrastructure boundaries.
- `docs/`: source specifications, product, architecture, implementation, API, testing, ADR, and operations documentation.
- `tests/`: integration, security, and end-to-end test boundaries.

Each application and service is intended to remain independently maintainable. Shared packages should expose stable contracts without importing application implementations or forcing a shared release cadence.

## Development Phases
Milestone 0 covers foundation and documentation review; Milestones 1–10 cover secure development foundations, donor MVP, administration, sandbox payments/ledger, marketplace, privacy/tax documents, recurring/restricted routes, future programs, operational readiness, and gated production release. The detailed task list and gates are in [`docs/implementation/milestone-tracker.md`](docs/implementation/milestone-tracker.md). The product phase proposal is in [`docs/product/mvp-scope.md`](docs/product/mvp-scope.md). All remain subject to owner and specialist review.

## Setup
No application features or frontend/backend business dependencies are implemented. The Firebase CLI was already installed globally; `firebase-functions` 7.4.0 is installed locally only so the Firebase CLI can load the empty Functions emulator entrypoint. Emulator binaries are cached per user on first run.

1. Review both PDFs in `docs/source/` and the extraction limitations in `docs/source/README.md`; apply V2.1 to conflicts without discarding V2.0 feature scope.
2. The local emulator scripts select Node 22.23.4 for Firebase Functions. Schedule an upgrade before its 2027-04-30 upstream EOL and re-verify Firebase support before that change.
3. Use the local-only emulator scripts in `infra/scripts/`; they select the verified portable Node 22 runtime for emulator child processes. **Unverified:** no app-specific build or application tests exist.
4. Copy `.env.example` to a local environment file only after approved configuration is available. Keep secret values out of version control.
5. Do not run deployment, Terraform apply, production Firebase setup, or live payment configuration as part of setup.

## Security and Status
Firebase Firestore and Storage rules currently deny all access. They are fail-closed placeholders, not usable authorization policies. Empty folders are retained with `.gitkeep` files. There are no business data fixtures, application features, integrations, or generated credentials.

See [`docs/implementation/technical-decisions.md`](docs/implementation/technical-decisions.md) for unresolved decisions and approval gates. The source PDFs were inspected for text extraction; no application runtime, provider integration, or cloud resource has been configured.
