# RentFlow Next Documentation Map

Start with **`ROADMAP.md`** for current status and **`IMPLEMENTATION_ROADMAP.md`** for the complete module-by-module execution plan.

## Status and planning
- `ROADMAP.md` — what is done, what is next, what blocks release.
- `IMPLEMENTATION_ROADMAP.md` — full implementation sequence, dependencies, milestone gates and production exit criteria.
- `modules/README.md` — index of detailed implementation specifications for every product module.
- `PARITY_MATRIX.md` — Laravel → Next.js evidence per capability.
- `FEATURE_DELIVERY_RECORD.md` — code vs demo vs production-backed readiness.
- `MIGRATION_PLAN.md` — migration method and phase definitions.
- `REQUIREMENTS_TRACEABILITY.md` — SRS requirement → code → verification.
- `HANDOFF.md` — where things live and what infrastructure is missing.

## Module implementation specifications
- `modules/00_FOUNDATION_AND_DESIGN_SYSTEM.md`
- `modules/01_IDENTITY_AND_ACCESS.md`
- `modules/02_ORGANIZATIONS_AND_GEOGRAPHY.md`
- `modules/03_PROPERTIES_AND_UNITS.md`
- `modules/04_PUBLIC_DISCOVERY_AND_INQUIRIES.md`
- `modules/05_TENANTS_AND_ONBOARDING.md`
- `modules/06_LEASES_AND_RENEWALS.md`
- `modules/07_PAYMENTS_AND_RECEIPTS.md`
- `modules/08_DOCUMENTS_AND_PRIVATE_STORAGE.md`
- `modules/09_SUPERVISORS_AND_SCOPE.md`
- `modules/10_MAINTENANCE.md`
- `modules/11_COMMUNICATIONS_AND_NOTIFICATIONS.md`
- `modules/12_REPORTING_AND_AUDIT.md`
- `modules/13_PLATFORM_ADMINISTRATION.md`
- `modules/14_INTEGRATIONS_AND_OPERATIONS.md`
- `modules/15_DATA_MIGRATION_AND_CUTOVER.md`

## Product
- `PRODUCT_REQUIREMENTS.md` — prioritized behavior.
- `SRS.md` — software requirements.
- `DOMAIN_MODEL.md` — vocabulary, states and invariants.

## Engineering
- `ARCHITECTURE.md` — system boundaries.
- `DATABASE_SCHEMA.md` and `SCHEMA_PARITY_GAPS.md` — persistence model and known gaps.
- `PRIVATE_STORAGE.md` — private document/media storage contract.
- `CODING_STANDARDS.md` — TypeScript/Next conventions.
- `TESTING.md` — test strategy and current coverage.
- `SECURITY.md` — security/privacy baseline.
- `DEPLOYMENT.md` — manual Vercel release process.
- `BRANCH_POLICY.md` — single implementation branch and PR flow.
- `DEVELOPER_ONBOARDING.md` — local setup.

## Design
- `DESIGN_SYSTEM.md` — ported Laravel tokens and components.
- `UI_UX_DESIGN.md` — information architecture and UX rules.

## Governance and operations
- `DECISIONS.md` — ADRs.
- `OPEN_DECISIONS.md` — unresolved external/product decisions.
- `RISK_REGISTER.md` — risks and controls.
- `OPERATIONS_AND_OBSERVABILITY.md` — operational controls.

The Laravel repository remains the source for legacy requirements evidence while migration is underway.
