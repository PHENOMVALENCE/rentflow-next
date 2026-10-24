# RentFlow Migration Parity Matrix

Status values: `NOT_STARTED`, `AUDITING`, `IN_PROGRESS`, `BLOCKED`, `PARITY`, `INTENTIONALLY_CHANGED`.

`PARITY` requires implementation plus validation evidence. `INTENTIONALLY_CHANGED` requires a documented decision.

| Area | Laravel reference | Next.js target | Status | Validation |
|---|---|---|---|---|
| Visual design system | `resources/css/{app,app-ui,public}.css`, `components/rf`, `components/pub` | `src/styles/*`, `src/components/{ui,icons,app-shell}.tsx`, `src/components/pub/*` | IN_PROGRESS | Baseline CSS ported verbatim (Livewire-only selectors removed); screenshots compared at 1440px and 390px |
| Public listings | `livewire/public/home`, `listing-show` | `src/app/page.tsx`, `src/app/listings/[id]` | IN_PROGRESS | Filters/sort unit-tested (`src/lib/listing-filters.test.ts`); quick-view dialog and photo lightbox not yet ported |
| Public inquiries | `listing-show` enquiry form | inline form on `/listings/[id]` + `submitPropertyInquiry` | IN_PROGRESS | Field validation messages per input still pending |
| Authentication | Laravel session auth | server auth boundary | NOT_STARTED | Pending |
| Role authorization | middleware/policies/gates | server policy layer | NOT_STARTED | Pending |
| Dashboard | `livewire/app/home*.blade.php`, `layouts/app` | `src/app/app/page.tsx`, `AppShell` | IN_PROGRESS | Role navigation unit-tested (`src/lib/navigation.test.ts`); property tiles and dedicated tenant/supervisor homes pending |
| Properties | property routes/UI/domain | property feature | AUDITING | Pending |
| Units | unit routes/UI/domain | unit feature | AUDITING | Pending |
| Tenants | tenant routes/UI/domain | tenant feature | AUDITING | Pending |
| Tenancies | models/services/UI | tenancy feature | AUDITING | Pending |
| Lease terms | lifecycle domain/UI | lease domain + feature | AUDITING | Pending |
| Renewal/grace/expiry | scheduler/domain services | idempotent domain + cron trigger | AUDITING | Pending |
| Agreements/documents | document storage/access | storage adapter + authorized routes | AUDITING | Pending |
| Payment obligations | payment domain | payment domain | AUDITING | Pending |
| Snippe payments | integration/service/webhook | provider adapter + webhook | AUDITING | Pending |
| Supervisor assignment | assignment/resolution logic | supervisor domain/service | AUDITING | Pending |
| Maintenance | maintenance workflow | maintenance feature | AUDITING | Pending |
| Community/notices | communication domain/UI | communication feature | AUDITING | Pending |
| Notifications | Laravel notifications/jobs | notification service/jobs | AUDITING | Pending |
| Audit history | audit events | audit service | AUDITING | Pending |
| Reporting | dashboard/report queries | reporting queries | AUDITING | Pending |
| OTP/SMS | Briq/provider integration | provider adapter | AUDITING | Pending |
| Scheduled jobs | Laravel scheduler/jobs | cron-triggered idempotent services | AUDITING | Pending |
| API surface | `/api/v1` routes | `/api/v1` route handlers where retained | AUDITING | Pending |
| Tests | PHPUnit/Pest | Vitest/Playwright | AUDITING | Pending |

## Audit checklist per capability

For each row capture:

- Laravel route(s)
- controller/Livewire component
- domain/service class
- model(s) and relevant migration(s)
- policy/middleware
- validation rules
- notification/job side effects
- integration dependencies
- Laravel tests
- expected UI states
- Next.js implementation paths
- automated parity tests
- manual acceptance evidence

## Critical parity gates

The following cannot be marked complete from UI similarity alone:

1. role/resource authorization;
2. public availability/listing eligibility;
3. lease lifecycle transitions;
4. exact full-term payment rule;
5. webhook reconciliation/idempotency;
6. private document access;
7. supervisor scope;
8. scheduled renewal/grace/expiry processing;
9. audit evidence.
