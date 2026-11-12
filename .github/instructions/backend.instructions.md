---
applyTo: "backend/**/*.ts"
---
# Backend TypeScript
- Use Firebase Cloud Functions and TypeScript with strict validation and explicit authorization at trusted boundaries.
- Keep each domain focused and independently testable; design money-moving operations for idempotency and auditability.
- Firestore is for application data; PostgreSQL is the financial ledger. Define cross-store consistency before implementation.
- Never trust client-supplied identity, permissions, payment state, or totals.
- Use Node.js 22 for Firebase Functions. Plan an upgrade before its upstream EOL on 2027-04-30 and verify Firebase runtime compatibility before changing the version.
- Do not implement live integrations or production behavior without approved specifications and explicit authorization.
