# Contributing

This repository is currently a documentation and structure scaffold. Do not implement product features, configure live payments, provision Firebase production resources, deploy infrastructure, or install dependencies until authorized.

Before contributing:
- Review the approved V2.1 specification; it takes precedence over conflicting V2.0 decisions.
- Check `docs/implementation/technical-decisions.md` and resolve applicable blockers.
- Keep mobile, backend, and each React admin application independently maintainable.
- Keep shared types and API contracts stable and framework-neutral.
- Update relevant documentation and tests with any approved implementation change.
- Never commit credentials, real personal or financial data, Terraform state, or production configuration.

Local Firebase emulator helpers are in `infra/scripts/`; see `docs/runbooks/local-development-setup.md`. The default check verifies emulator connectivity only. No application build, lint, or feature test suite exists yet; define and verify those checks when application foundations are approved.
