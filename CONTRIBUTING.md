# Contributing

This repository is primarily a documentation and structure scaffold, with a limited Firebase Functions foundation for health checks and verified account context. Do not treat that foundation as approved product functionality. Do not implement product features, configure live payments, provision Firebase production resources, deploy infrastructure, or install dependencies until authorized.

Before contributing:
- Review the approved V2.1 specification; it takes precedence over conflicting V2.0 decisions.
- Check `docs/implementation/technical-decisions.md` and resolve applicable blockers.
- Keep mobile, backend, and each React admin application independently maintainable.
- Keep shared types and API contracts stable and framework-neutral.
- Update relevant documentation and tests with any approved implementation change.
- Never commit credentials, real personal or financial data, Terraform state, or production configuration.

For backend work, use Node.js 22 and run these checks from the repository root:

```powershell
npm --prefix backend/functions run build
npm --prefix backend/functions run typecheck
npm --prefix backend/functions run lint
npm --prefix backend/functions test
```

Run backend emulator integration tests through the local helper, which starts the demo Auth, Firestore, Functions, and Storage emulators: `.\infra\scripts\run-local-tests.ps1 -TestCommand "npm --prefix backend/functions run test:emulator"`. Local Firebase emulator helpers and limitations are documented in `docs/runbooks/local-development-setup.md`. These checks cover only the current backend foundation; they do not establish production readiness or approval for product, payment, or infrastructure behavior.
