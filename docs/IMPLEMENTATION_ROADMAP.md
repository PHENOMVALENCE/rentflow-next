# RentFlow Next — Full Implementation Roadmap

**Purpose:** master execution plan for completing the Laravel → Next.js migration module by module.

This document complements `ROADMAP.md` (current state) and `PARITY_MATRIX.md` (evidence). It defines the **complete implementation order, module boundaries, dependencies, quality gates and production exit criteria**.

## 1. Definition of done

A module progresses through four levels:

1. **UI PRESENT** — routes, layouts, forms, states and responsive behavior exist.
2. **CODE COMPLETE** — domain rules, server actions/read models, authorization, validation and persistence paths exist.
3. **INTEGRATION VERIFIED** — PostgreSQL/provider/storage behavior is exercised with automated integration or contract tests.
4. **PRODUCTION READY** — deployment configuration, observability, failure handling, acceptance walkthrough and migration evidence are complete.

No module is considered complete because a screen renders in demo mode.

## 2. Delivery principles

- Laravel behavior remains the parity reference unless an ADR explicitly changes behavior.
- Implement on `codex/masterchanges`; merge milestone-sized PRs to `main`.
- Preserve authoritative domain state. UI flags never replace persisted business state.
- Every mutation is server-authorized and validated.
- Every high-risk transition is idempotent and audited.
- Public routes never expose private tenant or occupied-unit information.
- Provider/browser success is never authoritative for payments.
- Mobile, tablet and desktop states are required for every user-facing module.
- English/Kiswahili coverage is part of UI completion, not post-launch polish.

## 3. Module map

| # | Module | Primary outcome | Key dependency |
|---|---|---|---|
| 00 | Foundation & Design System | Stable app shell, persistence baseline, common UI and engineering contracts | None |
| 01 | Identity & Access | Secure phone/PIN auth, invitations, role/resource authorization | 00 |
| 02 | Organizations & Geography | Organization context, branding and normalized Tanzanian geography | 00, 01 |
| 03 | Properties & Units | Authoritative portfolio structure and unit availability | 02 |
| 04 | Public Discovery & Inquiries | Safe public listings, search, detail and inquiry pipeline | 03 |
| 05 | Tenants & Onboarding | Tenant records, attachment requests, onboarding and tenancy relationships | 01, 03 |
| 06 | Leases & Renewals | 3/6-month lease lifecycle, countdown, renewal, grace and expiry | 03, 05 |
| 07 | Payments & Receipts | Exact obligations, Snippe reconciliation, exceptions and receipts | 06 |
| 08 | Documents & Private Storage | Agreements, operational documents, uploads and access control | 01, 06 |
| 09 | Supervisors & Scope | Property assignment and restricted operational access | 01, 03 |
| 10 | Maintenance | Tenant issue reporting and auditable operational workflow | 05, 09 |
| 11 | Communications & Notifications | Notices, communities, in-app, SMS, email and WhatsApp delivery | 01, 03, 05 |
| 12 | Reporting & Audit | Scoped operational reports, exports and immutable evidence | All domain modules |
| 13 | Platform Administration | Cross-organization platform operations and incident visibility | 01, 02, 07, 12 |
| 14 | Integrations & Operations | Providers, cron, health, backups, observability and deployment controls | Domain modules |
| 15 | Data Migration & Cutover | Laravel data import, reconciliation, acceptance and production switch | 00–14 |

Detailed plans live under `docs/modules/`.

## 4. Execution sequence

### Wave A — Foundation and authoritative persistence

**Modules:** 00 → 01 → 02

Exit criteria:
- development PostgreSQL attached;
- initial Prisma migration committed and reproducible;
- bootstrap admin can authenticate with phone + PIN;
- organization context is persisted and authorized;
- shared UI primitives and responsive shell are stable;
- CI runs typecheck, lint, unit tests, build and PostgreSQL-backed integration tests.

### Wave B — Portfolio and public inventory

**Modules:** 03 → 04

Exit criteria:
- properties/buildings/units persist correctly;
- occupancy derives from authoritative relationships;
- only eligible units appear publicly;
- public search/detail/inquiry flows are tested without leaking private data.

### Wave C — Tenant and lease core

**Modules:** 05 → 06

Exit criteria:
- tenant onboarding is database-backed;
- organization and supervisor scope tests pass;
- lease creation enforces 3/6-month terms;
- T-14 renewal, end-date grace and T+7 expiry are retry-safe;
- tenant home reflects authoritative lease state.

### Wave D — Money and documents

**Modules:** 07 → 08

Exit criteria:
- exact full-term payment obligations persist;
- Snippe sandbox webhook reconciliation passes duplicate/mismatch tests;
- receipts derive from confirmed reconciliation;
- private documents use configured object storage and authorization tests.

### Wave E — Operations and communication

**Modules:** 09 → 10 → 11

Exit criteria:
- supervisors cannot cross assigned-property boundaries;
- maintenance workflow is end-to-end tested;
- notices/community scope is verified;
- outbound notification adapters are wired and provider delivery evidence is recorded.

### Wave F — Insight and platform operations

**Modules:** 12 → 13 → 14

Exit criteria:
- operational reports execute against PostgreSQL;
- all material transitions emit audit evidence;
- platform console operates across organizations without bypassing policy;
- cron, backups, restore, observability and failure alerts are production-tested.

### Wave G — Migration and cutover

**Module:** 15

Exit criteria:
- idempotent Laravel importer completed;
- counts, money totals and relationships reconcile;
- role-based acceptance passes on migrated data;
- no open P0/P1 issue in auth, authorization, listings, leases, payments or private data;
- rollback plan rehearsed.

## 5. Cross-cutting acceptance gates

Every module must satisfy all applicable gates before being marked production-ready:

### UX
- loading, empty, error, permission-denied and success states;
- 390px and 1440px responsive acceptance;
- keyboard focus and minimum touch targets;
- current RentFlow design language only;
- English/Kiswahili coverage.

### Security
- authenticated server mutation;
- resource-scope authorization;
- Zod/input validation;
- no secret/client leakage;
- private-object authorization where relevant.

### Data
- migration/schema exists;
- database constraints support the invariant;
- transaction boundaries identified;
- destructive actions auditable.

### Tests
- pure domain rules unit-tested;
- repository/application paths integration-tested;
- route/provider contracts tested;
- at least one Playwright happy-path and one denied/edge-path for critical modules.

### Operations
- relevant health/readiness signal;
- useful logs without secrets;
- retry/idempotency strategy;
- failure/recovery procedure documented.

## 6. Critical path

The shortest path to a trustworthy production release is:

`00 Foundation → 01 Identity → 02 Organization → 03 Portfolio → 05 Tenant → 06 Lease → 07 Payment → 08 Documents → 14 Production Operations → 15 Cutover`

Modules 04, 09, 10, 11, 12 and 13 can progress in parallel once their dependencies are stable, but they still block complete Laravel parity.

## 7. Milestone PR policy

Recommended PR boundaries:

- PR-A: Foundation + persistence + identity
- PR-B: Organization + portfolio + public discovery
- PR-C: Tenant + lease lifecycle
- PR-D: Payments + documents
- PR-E: Supervisors + maintenance + communication
- PR-F: Reports + platform + operations
- PR-G: Migration + cutover readiness

Within each PR, continue making small focused commits.

## 8. Status ownership

- `ROADMAP.md` — current status and immediate next steps.
- `IMPLEMENTATION_ROADMAP.md` — full target execution plan.
- `modules/*.md` — detailed module implementation specifications.
- `PARITY_MATRIX.md` — parity/evidence status.
- `FEATURE_DELIVERY_RECORD.md` — infrastructure/provider evidence.
- `REQUIREMENTS_TRACEABILITY.md` — requirement → implementation → verification mapping.

When implementation changes one of these truths, update the relevant document in the same PR.
