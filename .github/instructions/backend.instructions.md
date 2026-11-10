---
applyTo: "backend/**/*.ts"
---
# Backend TypeScript
- Use Firebase Cloud Functions and TypeScript with strict validation and explicit authorization at trusted boundaries.
- Keep each domain focused and independently testable; design money-moving operations for idempotency and auditability.
- Firestore is for application data; PostgreSQL is the financial ledger. Define cross-store consistency before implementation.
- Never trust client-supplied identity, permissions, payment state, or totals.
- Node.js runtime selection is unresolved; verify Firebase support for a current LTS before pinning it.
- Do not implement live integrations or production behavior without approved specifications and explicit authorization.
