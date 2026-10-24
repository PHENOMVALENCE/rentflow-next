# RentFlow Next — Module Status Tracker

**Reviewed:** 24 October 2026

This tracker maps the detailed module plans to the current repository state. It is intentionally conservative: a module does not advance to integration-verified without PostgreSQL/provider/storage evidence.

| Module | Current state | What exists now | Next gate |
|---|---|---|---|
| 00 Foundation & Design System | UI PRESENT / foundation partial | App Router structure, design system, shells, CI unit/build gates | Initial Prisma migration + PostgreSQL CI |
| 01 Identity & Access | UI PRESENT / code partial | registration/login/PIN/invitations/session/authorization code | identity schema fixes + DB scope tests + OTP sandbox |
| 02 Organizations & Geography | UI PRESENT / code partial | organization settings, platform context, geography actions/UI | normalized geography + DB isolation + storage-backed branding |
| 03 Properties & Units | UI PRESENT / code partial | routes, read models/actions, portfolio UI | PostgreSQL CRUD + occupancy/availability integration tests |
| 04 Public Discovery & Inquiries | UI PRESENT / code partial | public search/detail, filters, lightbox, quick view, inquiry pipeline | DB eligibility test + inquiry delivery + virtual-tour decision |
| 05 Tenants & Onboarding | UI PRESENT / code partial | tenant routes/actions, onboarding, import/attachment surfaces | DB tenant/self/supervisor scope tests |
| 06 Leases & Renewals | CODE COMPLETE / unverified | domain rules, lease actions, renewal planning, cron, reminders, UI | PostgreSQL transaction/idempotency tests |
| 07 Payments & Receipts | CODE COMPLETE / unverified | exact obligation rules, Snippe adapter/webhook, reconciliation code, pay/receipt UI | Snippe sandbox + duplicate/mismatch DB tests |
| 08 Documents & Private Storage | UI PRESENT / BLOCKED | agreement/library routes, access logic, storage contract, agreement UI | configure private object store + authorization tests |
| 09 Supervisors & Scope | UI PRESENT / code partial | invitation/management/home/scoping helpers | assigned-resource DB tests |
| 10 Maintenance | UI PRESENT / code substantial | workflow read/actions, status transitions, timeline UI | creation/transition/scope integration tests |
| 11 Communications & Notifications | UI PRESENT / code partial | notices/community/in-app UI, reminder intents, provider adapters | provider decisions + outbound workflow wiring |
| 12 Reporting & Audit | UI PRESENT / code substantial | report runner, CSV export, audit reads/writes, report UI | PostgreSQL execution + missing report data + audit completeness |
| 13 Platform Administration | UI PRESENT / code substantial | control center, module/detail routes, organization context | DB/platform action tests + production health evidence |
| 14 Integrations & Operations | CODE PARTIAL / infrastructure blocked | health endpoints, provider adapters, CI, cron handlers | provision/test DB, storage, providers, monitoring, backups |
| 15 Data Migration & Cutover | NOT STARTED | migration method documented | build idempotent Laravel importer after target schema stabilizes |

## Immediate execution order

1. Module 00 — database/migration/CI foundation.
2. Module 01 — identity schema and real auth.
3. Module 02 — organization isolation/geography.
4. Module 03 — real portfolio persistence.
5. Module 05 + 06 — tenant/lease critical path.
6. Module 07 + 08 — money/private documents.
7. Modules 09–13 — operations, communication, insight and platform parity.
8. Module 14 — production infrastructure closure.
9. Module 15 — production data migration and cutover.

## Status update rule

Whenever a module crosses a gate, update this tracker and add the actual evidence to `PARITY_MATRIX.md` / `FEATURE_DELIVERY_RECORD.md` in the same PR.
