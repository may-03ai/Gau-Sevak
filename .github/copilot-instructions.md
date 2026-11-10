# GAU-SEVAK Project Instructions

## Project Identity
Gau-Sevak is an India-first multi-Gaushala donation marketplace. The original Gau-Sevak Master System Prompt V2.0 is the source blueprint; V2.1 is a corrective override pack that controls conflicts without replacing the full V2.0 product scope. Both PDFs are available in `docs/source/`. Never invent requirements or treat unresolved legal or technical decisions as approved.

## Technology Stack
- Mobile: Flutter, Dart, and Riverpod; follow clean architecture.
- Admin panels: separate React + TypeScript applications using Ant Design.
- Backend: Firebase Cloud Functions + TypeScript, with strict mode.
- Data: Firestore for application data and PostgreSQL for the financial ledger.
- Authentication: Firebase Auth.
- Payments: Razorpay Route; development integrations must use sandbox mode.
- Storage: Firebase Storage.
- PDF generation: Cloud Run service.
- Infrastructure: Terraform.
- Node.js runtime: Node 22 is the V2.1 baseline and is listed as a Firebase Functions runtime. The official Node.js release schedule lists upstream EOL as 2027-04-30; plan an upgrade before then. Do not use Node 20 or select another runtime unless Firebase's official runtime documentation confirms compatibility.

## Documentation and Architecture Rules
- Read relevant files in `docs/product/` before implementing product features.
- Read relevant files in `docs/architecture/` before changing system architecture.
- Follow V2.0 as the source blueprint and apply V2.1 wherever it corrects or conflicts with V2.0.
- Record consequential architecture decisions in `docs/adr/`; document assumptions and unresolved questions rather than treating them as approved.
- Keep Firestore as application data storage and PostgreSQL as the financial ledger. Define ownership, consistency, and reconciliation boundaries before implementing cross-store workflows.
- Keep PDF generation isolated in `backend/pdf-service` and infrastructure definitions in `infra/terraform`.
- Update relevant documentation when architecture changes. Mark unverified setup and placeholder content clearly; never call placeholders working implementations.

## Development Rules
- Work on one milestone at a time. Never implement the entire application in one task or broaden work into unrelated changes.
- Keep mobile, backend, `admin-gaushala`, and `admin-super` independently maintainable and deployable.
- Keep shared types and API contracts reusable, framework-neutral, and versioned; avoid tight coupling between applications.
- Use TypeScript strict mode, reusable maintainable components, and proper error handling. Follow clean architecture in Flutter.
- Add tests for important behavior and run relevant tests after changes. Report checks that could not be run.
- Do not rewrite unrelated files or add unnecessary dependencies.

## Security Requirements
- Never expose API keys, credentials, or secrets in frontend code or version control. `.env.example` must contain variable names with blank values only.
- Never trust payment amounts supplied by clients. Validate authorization and all sensitive business rules on the backend.
- Never allow clients to modify financial records directly. Make financial operations auditable and idempotent.
- Never log PAN, bank details, OTPs, secrets, or unnecessary sensitive personal data.
- Deny access by default in Firebase rules; grant only reviewed, explicitly authorized access.
- Never enable real donations without required legal, compliance, security, and business approvals.
- Minimize sensitive data and define retention, audit, and incident-response requirements before implementation.

## Copilot Working Method
Before each task:
1. Inspect the existing code and relevant documentation.
2. Explain the intended implementation and keep it within the requested milestone.
3. Implement only the requested scope, preserving unrelated user changes.
4. Run relevant tests or checks and report their results accurately.
5. List changed files and remaining issues or unresolved decisions.

Never claim a feature or the system is production-ready without evidence. This repository began as a structure scaffold; verify implementation and configuration before relying on any component.
