# RentFlow Next

Next.js reimplementation of the existing RentFlow Laravel application.

## Migration objective

Rebuild RentFlow in Next.js while preserving the current product behavior, domain rules, roles, workflows and user-facing capabilities. The Laravel repository (`PHENOMVALENCE/RentFlow`) remains the behavioral reference during migration.

This is a parity migration, not a product rewrite. Architectural changes must not silently change lease, payment, availability, authorization, maintenance or supervisor-assignment rules.

## Target stack

- Next.js (App Router)
- TypeScript
- React Server Components by default
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Zod validation
- Auth.js-compatible authentication boundary
- Vitest for unit/domain tests
- Playwright for end-to-end tests
- Vercel deployment target

Provider-specific integrations are isolated behind adapters so Snippe, Briq/SMS and future providers do not leak into the core domain.

## Core product surfaces

- Public property/unit discovery
- Landlord / property administrator workspace
- Tenant workspace
- Supervisor workspace
- Platform administration
- Lease lifecycle and renewal/grace processing
- Full-term payment obligations and reconciliation
- Agreement/document access
- Maintenance workflow
- Notices/community communication
- Notifications and audit history
- Operational reporting

## Repository structure

```text
src/
  app/             # routes, layouts, route handlers
  components/      # reusable UI
  features/        # feature-specific UI/actions/queries
  domain/          # framework-independent business rules
  server/          # auth, db, services, repositories, integrations
  lib/             # shared utilities
  types/           # shared TypeScript contracts
prisma/            # schema, migrations, seed
public/             # static assets
tests/              # test support and cross-feature tests
docs/               # architecture, parity and implementation docs
```

## Migration rules

1. Laravel behavior is the reference until a documented Next.js decision supersedes it.
2. Preserve authoritative domain state; do not replace it with UI-only flags.
3. Payment callbacks/server reconciliation are authoritative; browser success is not.
4. Public listings must never expose occupied/private tenant data.
5. Authorization is enforced server-side for every protected operation.
6. Every migrated capability is recorded in `docs/PARITY_MATRIX.md`.
7. New behavior requires an ADR or explicit product decision.
8. Secrets must never be committed.

## Delivery phases

1. Foundation and documentation.
2. Database/domain model and authentication.
3. Public listings.
4. Property/unit and supervisor operations.
5. Tenant/tenancy/lease workflows.
6. Payments and agreements.
7. Maintenance, notices and notifications.
8. Reporting, audit, scheduled workflows and hardening.
9. Parity validation and cutover.

See `docs/MIGRATION_PLAN.md` and `docs/ARCHITECTURE.md`.
