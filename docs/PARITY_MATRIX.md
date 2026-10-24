# RentFlow Migration Parity Matrix

**Last reviewed:** 24 October 2026 · branch `codex/masterchanges`

Status values: `NOT_STARTED`, `AUDITING`, `IN_PROGRESS`, `BLOCKED`, `PARITY`, `INTENTIONALLY_CHANGED`.

- `IN_PROGRESS` means Next.js code exists for the capability but parity has not been validated against PostgreSQL.
- `PARITY` requires implementation plus validation evidence (automated tests and a recorded role walkthrough). **No row qualifies yet** — the database has never been attached (see `ROADMAP.md` M1–M2).
- `INTENTIONALLY_CHANGED` requires a documented decision in `DECISIONS.md`.
- Gap IDs (G1…) refer to `ROADMAP.md` §4.

## Capability matrix

### Public and access

| Area | Laravel reference | Next.js implementation | Status | Evidence / remaining |
|---|---|---|---|---|
| Visual design system | `resources/css/*`, `components/rf`, `components/pub`, `layouts/*` | `src/styles/*`, `src/components/{ui,icons,app-shell}.tsx`, `src/components/pub/*` | IN_PROGRESS | CSS ported; screenshots compared at 1440px/390px for home, detail, auth, dashboard. Remaining screens via compatibility layer (M4). |
| Public discovery | `livewire/public/home` + partials | `src/app/page.tsx`, `src/lib/listing-filters.ts`, `src/components/pub/listing-grid.tsx` | IN_PROGRESS | Filter/sort unit tests; desktop quick view checked in browser (focus moves to Close, Escape restores focus). |
| Listing detail | `livewire/public/listing-show` | `src/app/listings/[id]/page.tsx`, `src/components/pub/gallery.tsx` | IN_PROGRESS | Mosaic, swipe strip and keyboard lightbox ported. Virtual tour missing (G6). |
| Listing eligibility | availability rules, listing queries | `src/domain/listing-eligibility.ts`, `public-listing-read-model.ts`, `/api/listing-images/[id]` | IN_PROGRESS | Domain unit tests. Needs DB test that occupied units never appear (critical gate 2). |
| Public enquiries | `listing-show` enquiry form, `SendInquiryEmail` | inline form + `submitPropertyInquiry`, `/api/v1/listings/[listing]/inquiries` | IN_PROGRESS | No inquiry email (G4); no per-field validation messages. |
| Registration | `livewire/auth/register` | `/register`, `/register/verify`, `registration-actions.ts` | IN_PROGRESS | OTP via Briq adapter; needs provider sandbox run. |
| Sign-in (phone + PIN) | `livewire/auth/login` | `/login`, `server/auth/actions.ts`, `sign-in-guard.ts` | IN_PROGRESS | Throttling and credential-bound sessions in code; PIN stored in `passwordHash` until schema gap closes. |
| PIN recovery / change | `login` code mode, `account/change-pin` | `/forgot-pin`, `/app/account`, `/app/pin` | IN_PROGRESS | Phone normalization tests only. |
| Invitations | `invite-accept`, `supervisor-invite-accept` | `/invite/[token]`, `/supervisors/accept`, `/join/[code]` | IN_PROGRESS | Token encode/decode in code; no tests. |
| Role authorization | policies, gates, middleware | `server/auth/authorization.ts`, per-page `requireSession`, read-model scoping | IN_PROGRESS | Permission-matrix unit tests. Needs cross-org/cross-tenant DB tests (critical gate 1). |
| Navigation by role | `layouts/partials/nav.blade.php`, `PlatformNavigation` | `src/lib/navigation.ts` | IN_PROGRESS | Unit tests for tenant/supervisor exclusions, platform vs organization context and exact-match overview. |

### Workspace

| Area | Laravel reference | Next.js implementation | Status | Evidence / remaining |
|---|---|---|---|---|
| Staff dashboard | `livewire/app/home` | `src/app/app/page.tsx`, `read-model.ts` | IN_PROGRESS | Property tiles panel not ported. Platform admins outside an organization land on `/app/platform` (Laravel parity). |
| Tenant / supervisor / pending home | `home-tenant`, `home-supervisor`, `home-pending` | `src/components/home/role-home.tsx`, `home-read-model.ts`, `src/domain/tenant-journey.ts` | IN_PROGRESS | Next-step, countdown and lease-rail rules unit-tested; screens checked at 1440px/390px in demo mode. |
| Properties & buildings | `properties/*`, `buildings/form` | `/app/properties/**`, `property-actions.ts` | IN_PROGRESS | — |
| Units & listings management | `units/form`, `listings/manage` | `/app/[section]` (units, listings), `listing-actions.ts`, `listing-image-actions.ts` | IN_PROGRESS | Image upload needs private storage (M5). |
| Tenants & tenancies | `tenants/*`, `tenancies/form` | `/app/tenants/**`, `tenant-actions.ts`, `tenant-read-model.ts` | IN_PROGRESS | — |
| Portfolio import | `portfolio/import` | `/app/tenants/import`, `portfolio-import-actions.ts` | IN_PROGRESS | — |
| Attachment requests | `attachment-requests/*` | `/app/attachment-requests`, `attachment-actions.ts` | IN_PROGRESS | Sessions without an organization see an explanation instead of a 404. |
| Tenant onboarding | `onboarding/*` | `/app/onboarding/{profile,lease}` | IN_PROGRESS | — |
| Supervisors | `supervisors/*` | `/app/supervisors/{create,manage}`, `supervisor-actions.ts` | IN_PROGRESS | Scope enforcement needs DB tests (critical gate 7). |
| Organization branding | `organization/branding` | `/app/organization`, `organization-actions.ts` | IN_PROGRESS | Logo upload depends on private storage. |
| Standard lease templates | `lease-templates/index` | `/app/standard-leases`, `/api/lease-templates/[id]/download` | IN_PROGRESS | Depends on private storage. |
| Geography settings | `ImportTcraGeographyCommand` | `/app/settings/geography`, `geography-actions.ts` | IN_PROGRESS | Normalized geography relations pending (`SCHEMA_PARITY_GAPS.md` §5). |
| Profile & account | `profile/show`, `account/*` | `/app/profile` → `/app/account` | IN_PROGRESS | WhatsApp history missing (G10). |
| Language switcher | `x-rf.language-switcher`, `Phrases`, `lang/sw*` | `src/i18n/*`, `src/components/language-switcher.tsx` | IN_PROGRESS | Laravel catalog imported (3,292 phrases) plus `sw.extra.json`; coverage tests fail on untranslated phrases. Staff list/detail, platform, reports and invitation pages not yet wrapped (G8). |

### Lease and money

| Area | Laravel reference | Next.js implementation | Status | Evidence / remaining |
|---|---|---|---|---|
| Lease creation (3/6 months) | `leases/*`, lease services | `/app/leases/new`, `lease-creation.ts`, `lease-actions.ts` | IN_PROGRESS | Term rule tested in `renewal.test.ts`. |
| Lease detail & countdown | `leases/show` | `/app/leases/[id]` | IN_PROGRESS | — |
| Renewal / grace / expiry | `AdvanceLeaseLifecycleCommand` (01:15 EAT), `LeaseMilestones` | `/api/cron/leases` (22:15 UTC = 01:15 EAT), `src/domain/{rentflow,renewal}.ts`, `renewal-actions.ts` | IN_PROGRESS | Timing tests match Laravel (EAT days, grace on end date, expiry after end+7, forward-only). Cron uses conditional updates. Needs retry DB test (critical gate 8). |
| Lease reminders | `SendLeaseRemindersCommand` (08:00 EAT) | `/api/cron/lease-reminders` (05:00 UTC), `src/domain/lease-reminders.ts`, `lease-reminders.ts` | IN_PROGRESS | Template selection, EAT day and dedupe key unit-tested. In-app only; SMS waits on G4. |
| Payment obligations | payment domain | `PaymentObligation` model, `lease-creation.ts` | IN_PROGRESS | Exact-amount rule unit-tested (critical gate 4). |
| Snippe initiation & webhook | integration + webhook controller | `server/payments/{snippe,reconcile,actions}.ts`, `/api/webhooks/payments/snippe` | IN_PROGRESS | Signature freshness tests. Needs duplicate/mismatch DB tests (critical gate 5) and sandbox run. |
| Pay screen | `payments/pay` | `/app/leases/[id]/pay` | IN_PROGRESS | — |
| Receipts | `payments/receipts`, `receipt-show` | `/app/receipts/**` | IN_PROGRESS | Print/export not verified. |
| Unpaid terms / exceptions | `payments/unpaid-terms`, `exceptions` | `/app/unpaid-terms`, `/app/payment-exceptions` | IN_PROGRESS | — |
| Agreements & documents | `agreements/index`, `documents/library` | `/app/agreements/**`, `/app/operational-documents/**`, `/api/documents/[id]/download`, `document-access.ts` | BLOCKED | Private storage adapter not configured (`PRIVATE_STORAGE.md`); critical gate 6. |

### Operations and communication

| Area | Laravel reference | Next.js implementation | Status | Evidence / remaining |
|---|---|---|---|---|
| Maintenance | `maintenance/*` | `/app/maintenance/**`, `maintenance-actions.ts` | IN_PROGRESS | — |
| Enquiry pipeline | `inquiries/index` | `/app/inquiries/**`, `inquiry-actions.ts` | IN_PROGRESS | — |
| Notices & safety | `notices/*`, `safety/*`, `SafetyNoticeAlert` | `/app/notices/**`, `/app/safety/**`, `notice-actions.ts` | IN_PROGRESS | `/app/safety` redirects to notices. Notice bell not ported. |
| Community | `community/index`, `community/show` | `/app/community`, `/app/community/[id]`, `community-actions.ts` | IN_PROGRESS | Index added 24 Oct 2026. Messaging needs DB. |
| Notifications (in-app) | `TenantJourneyNotice`, notices bell | `/app/notifications`, `notification-actions.ts` | IN_PROGRESS | — |
| Outbound email / SMS / WhatsApp | `app/Jobs/*` | adapters in `server/integrations/*` only | NOT_STARTED | G4; production SMS provider undecided. |
| OTP | Briq integration | `server/integrations/briq-otp.ts` | IN_PROGRESS | Needs credentials (M5). |

### Insight and platform

| Area | Laravel reference | Next.js implementation | Status | Evidence / remaining |
|---|---|---|---|---|
| Reports | `reports/index`, `reports/document` | `/app/reports`, `/app/reports/export`, `report-runner.ts`, `src/lib/csv.ts` | IN_PROGRESS | Scoped report runners and CSV export (formula-injection safe, tested). Queries unexecuted until DB attached. Expenses, statements, scorecard, controls and saved reports marked unavailable. |
| Audit history | audit events | `AuditLog` writes in actions, `audit-read-model.ts` | IN_PROGRESS | Needs check that every material transition writes audit (critical gate 9). |
| Platform console | `platform/*` (19 screens), `PlatformContext` | `/app/platform/**` incl. organization/user/payment/incident detail, `platform-context-actions.ts` | IN_PROGRESS | Enter/exit organization context audited; detail pages checked in demo mode. Incident states limited to OPEN/ACKNOWLEDGED/RESOLVED (`SCHEMA_PARITY_GAPS.md` §2). |
| API v1 | `routes/api.php` | `/api/v1/*` (properties, buildings, units, listings, tenants, leases, payments, maintenance, inquiries) | IN_PROGRESS | No contract tests. |
| Health | `CheckDeploymentCommand` | `/api/health`, `/api/health/readiness` | IN_PROGRESS | — |
| Backups | `BackupCommand` and related | — | NOT_STARTED | G9; may be provider-managed. |
| Data migration from Laravel | — | — | NOT_STARTED | M6. |
| Automated tests | PHPUnit/Pest (93 test files) | Vitest unit tests (57 tests) | IN_PROGRESS | No integration, contract or Playwright tests (M2). |

## Audit checklist per capability

Before moving a row to `PARITY`, record:

- Laravel route(s), Livewire component, service, model and migration;
- policy/middleware and validation rules;
- notification/job side effects and integration dependencies;
- Laravel tests and expected UI states;
- Next.js implementation paths;
- automated parity tests and manual acceptance evidence (who, when, which role, which data).

## Critical parity gates

These cannot be marked complete from UI similarity alone:

1. role/resource authorization;
2. public availability/listing eligibility;
3. lease lifecycle transitions;
4. exact full-term payment rule;
5. webhook reconciliation/idempotency;
6. private document access;
7. supervisor scope;
8. scheduled renewal/grace/expiry processing;
9. audit evidence.
