# Laravel → Next.js Migration Plan

## Goal

Reach behavioral and functional parity with `PHENOMVALENCE/RentFlow` before cutover. Migration is incremental and evidence-driven.

This document defines the **method and phases**. Current status, milestone order and open gaps are tracked in `ROADMAP.md`.

| Phase | Status (24 Oct 2026) |
|---|---|
| 0 Baseline audit | Done — inventory reflected in `PARITY_MATRIX.md` |
| 1 Foundation | Done except PostgreSQL in CI and integration-test harness |
| 2 Data/domain | Schema and domain functions written; **no migration generated** (`ROADMAP.md` M1) |
| 3 Public surface | Code complete except quick view, lightbox, virtual tour |
| 4 Property operations | Code complete; unvalidated |
| 5 Tenant & lease lifecycle | Code complete except tenant home and reminders |
| 6 Payments | Code complete; needs Snippe sandbox and idempotency DB tests |
| 7 Operations | In-app complete; outbound delivery missing |
| 8 Reporting & scheduling | Metrics and cron exist; report generation/export missing |
| 9 Validation & cutover | Not started |

## Phase 0 — Baseline audit

Inventory Laravel routes, models, migrations, policies, middleware, Livewire/pages, controllers, jobs, notifications, commands, tests and integrations. Populate `PARITY_MATRIX.md` before claiming parity.

## Phase 1 — Foundation

- Next.js App Router + strict TypeScript
- Tailwind and design tokens
- lint/typecheck/test scripts
- environment validation
- Prisma/PostgreSQL baseline
- auth/authorization boundary
- CI
- project docs and ADR convention

Exit gate: clean build, lint, typecheck and test pipeline.

## Phase 2 — Data/domain migration

Translate the canonical Laravel data/domain model into Prisma without changing business semantics. Implement domain types and pure state-transition functions first.

Priority: organization/geography → users/roles → properties → units → tenants → tenancies → lease terms → documents → obligations/payments → supervisor assignments → maintenance → notices/community → notifications/audit.

Exit gate: schema reviewed against Laravel migrations/models and critical domain tests pass.

## Phase 3 — Public surface

Implement public listings, listing detail, property images/virtual-tour access and inquiry flow. Public eligibility must derive from authoritative state.

## Phase 4 — Authenticated property operations

Implement role-aware shell, dashboard, properties, units, tenant administration and supervisor assignments.

## Phase 5 — Tenant and lease lifecycle

Implement tenant dashboard, tenancy, lease term, countdown, agreement access, renewal window, grace and expiry/re-listing transitions.

## Phase 6 — Payments

Implement payment obligation, payment initiation, provider adapter, webhook/reconciliation, receipts, exceptions and audit evidence. Do not enable production payment credentials until idempotency and mismatch tests pass.

## Phase 7 — Operations

Implement maintenance, notices/community, notifications, supervisor workflows and operational communication.

## Phase 8 — Reporting and scheduled workflows

Implement dashboards/reporting from authoritative records and idempotent scheduled transition discovery.

## Phase 9 — Parity validation and cutover

For every Laravel capability:

- identify reference route/component/service;
- identify Next.js equivalent;
- run automated tests where possible;
- perform role-based manual acceptance;
- mark parity only with evidence.

Cutover requires no unresolved P0/P1 parity gaps in authentication, authorization, availability, lease lifecycle, payments or private data access.

## Commit strategy

All work lands on `codex/masterchanges` (`BRANCH_POLICY.md`). Prefer small, reviewable commits:

- `chore:` tooling/configuration
- `docs:` documentation
- `feat(domain):` domain capability
- `feat(public):` public UI
- `feat(admin):` landlord/admin workflow
- `feat(tenant):` tenant workflow
- `feat(supervisor):` supervisor workflow
- `feat(payments):` payment capability
- `test:` tests
- `fix:` defect/parity correction

Do not combine schema redesign, provider integration and large UI work in one commit.
