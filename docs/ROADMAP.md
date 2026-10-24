# RentFlow Next Implementation Roadmap

**Last reviewed:** 24 October 2026 · branch `codex/masterchanges`

This is the single source for **what is done, what is next and what blocks release**. Per-capability evidence lives in `PARITY_MATRIX.md`; infrastructure readiness lives in `FEATURE_DELIVERY_RECORD.md`. When those documents and this roadmap disagree, fix the roadmap in the same commit.

## 1. Where the project stands

| Dimension | State |
|---|---|
| Laravel capability coverage | Every Laravel screen has a Next.js route, including role homes, platform detail pages and report generation. Open gaps (G4, G6 virtual tour, G8 remaining screens, G9, G10) are listed in §4. |
| Visual parity | Laravel CSS and component markup ported (see `DESIGN_SYSTEM.md`). Public home, listing detail (gallery lightbox, quick view), auth flows, shell, staff dashboard, tenant/supervisor/pending homes, community index, reports and platform detail pages rebuilt; other screens render through the compatibility layer. |
| Domain rules | Lease milestones (EAT calendar days, forward-only, matching Laravel `LeaseMilestones`), reminders, tenant next step, listing eligibility, renewal planning and exact payment matching are pure functions with unit tests (`src/domain`). |
| Persistence | Prisma schema has 44 models. **No migration has been generated or applied.** Known schema gaps are in `SCHEMA_PARITY_GAPS.md`. |
| Runtime mode | Without `DATABASE_URL` the app runs in demo mode with synthetic read data. The demo session is a platform admin unless `DEMO_ROLE` is set at build time (`DEVELOPER_ONBOARDING.md`). Write paths, reports and organization context require the database. |
| Quality gates | `typecheck`, `lint`, `test` (57 unit tests) and `next build` pass locally; CI runs all four. No integration or Playwright tests exist yet. |
| Release | Merged to `main` through PR #2 (24 Oct 2026). Vercel Git deployments are disabled (`vercel.json`); production deploys are manual and have not been run for this release (see `DEPLOYMENT.md`). |
| Validated parity | **None.** No row in `PARITY_MATRIX.md` is `PARITY` because no capability has been exercised end-to-end against PostgreSQL. |
| Bottom line | Everything that can be built without external infrastructure is built. What remains is M1 (database), M2 (integration evidence), M5 (providers) and M6 (data cutover) — none can be finished from code alone. |

## 2. Milestones

Milestones are sequential gates. Work inside a milestone can run in parallel; a milestone closes only when its exit gate is met with evidence recorded in `PARITY_MATRIX.md`.

### M1 — Persistence foundation · *next*

Goal: a real database underneath the existing code.

1. Attach a development PostgreSQL database (approval required for anything billable — see `OPEN_DECISIONS.md`).
2. Resolve the schema gaps that affect identity first: dedicated `pinHash`/`pinSetAt`, normalized unique phone (`SCHEMA_PARITY_GAPS.md` §1).
3. Generate the initial Prisma migration; review the SQL; commit it under `prisma/migrations`.
4. Run `npm run db:seed` with bootstrap variables and sign in with phone + PIN.
5. ~~Replace the silent 404 on organization-only pages~~ — done 24 Oct 2026 (`NeedsOrganization`).

**Exit gate:** migration committed and applied to a disposable database; bootstrap admin can sign in; `npm run build` passes against it.

### M2 — Verify the critical paths

Goal: turn "code exists" into evidence for the nine critical parity gates.

1. Add repository/integration tests against a disposable PostgreSQL instance (Vitest + test database) for: organization isolation, supervisor scope, tenant self-scope, listing eligibility re-checks, lease creation 3/6-month rule, renewal successor creation, cron transition idempotency, webhook duplicate/mismatch handling, private document authorization.
2. Add Playwright and the minimum role journeys from `TESTING.md`.
3. Add a PostgreSQL service to CI (lint already runs in CI since 24 Oct 2026).
4. Mark parity rows `PARITY` only when automated tests and a role walkthrough are recorded.

**Exit gate:** all nine critical gates in `PARITY_MATRIX.md` have automated evidence.

### M3 — Close functional gaps · *mostly done*

Goal: features Laravel has that Next.js does not (see §4). Done on 24 Oct 2026: G1, G2, G3, G5, G7, G11, G6 (quick view and lightbox) and G8 for the public site, sign-in flows, shell and homes. Remaining:

1. Outbound notification delivery (G4) — blocked on provider decisions.
2. Virtual tour (G6) — needs a schema field and private media storage.
3. WhatsApp message history (G10) — depends on G4.
4. Report types that need data the schema lacks (expenses, statements, saved reports) — see `report-runner.ts`.

**Exit gate:** every gap is either implemented with tests or recorded as `INTENTIONALLY_CHANGED` with an ADR.

### M4 — Visual and UX parity sweep

Goal: replace compatibility-layer rendering with ported Laravel markup, screen by screen.

1. Port remaining screens in this order: properties → units/buildings → tenants → leases/pay/receipts → maintenance → notices/safety/community → reports → platform console.
2. Each screen: loading, empty and error states; keyboard focus; 390px and 1440px screenshots compared with Laravel.
3. Translate the remaining staff, platform and invitation screens (G8). Wrap strings with `t()`; the coverage test fails until every new phrase has Kiswahili in `src/i18n/sw.json` or `sw.extra.json`.

**Exit gate:** `globals.css` compatibility layer can be deleted without visual regressions.

### M5 — Production infrastructure

Goal: everything external that the code already supports through adapters.

1. Production PostgreSQL, `AUTH_SECRET`, `CRON_SECRET`.
2. Private object storage adapter (`PRIVATE_STORAGE.md`) for agreements, documents and listing media.
3. Snippe credentials and webhook URL; sandbox end-to-end payment including duplicate and mismatched callbacks.
4. Briq OTP credentials; notification SMS provider decision; WhatsApp templates if enabled.
5. Backups and restore drill (G9).
6. Observability: error reporting and payment/scheduler failure alerts (`OPERATIONS_AND_OBSERVABILITY.md`).

**Exit gate:** each provider exercised in its sandbox from the deployed preview, with evidence in `FEATURE_DELIVERY_RECORD.md`.

### M6 — Data migration and cutover

1. Map Laravel tables to Prisma models; write an idempotent import from a Laravel database snapshot.
2. Dry-run the import on a copy; reconcile counts and money totals.
3. Run role-based acceptance on migrated data.
4. Cutover plan: freeze Laravel writes, final import, switch DNS, monitor, keep Laravel read-only for rollback.

**Exit gate:** no open P0/P1 gaps in authentication, authorization, availability, lease lifecycle, payments or private data access (`MIGRATION_PLAN.md` Phase 9).

## 3. Release cadence

- Commit small changes to `codex/masterchanges` continuously.
- Open a PR to `main` at each milestone exit gate, not per commit. Review security, migration, payment and authorization changes before merging; the auto-merge workflow prefers branch content on conflicts (`BRANCH_POLICY.md`).
- Deploy to production only on explicit request, after the checklist in `DEPLOYMENT.md`.

## 4. Known gaps against Laravel

| ID | Gap | Laravel reference | Status |
|---|---|---|---|
| G1 | Dedicated tenant and supervisor home screens | `livewire/app/home-tenant`, `home-supervisor` | **Done** 24 Oct 2026 |
| G2 | Home for accounts not yet attached to an organization | `livewire/app/home-pending` | **Done** 24 Oct 2026 |
| G3 | Daily lease reminders (08:00 EAT), one per lease and template | `SendLeaseRemindersCommand` | **Done** in-app; SMS delivery waits on G4 |
| G4 | Outbound delivery: inquiry email, platform alert email, tenant SMS copy, SMS and WhatsApp jobs. Adapters exist but are not wired into workflows | `app/Jobs/*`, `app/Notifications/*` | M5 — blocked on provider decisions |
| G5 | Report generation and export | `livewire/app/reports`, `reports/document.blade.php` | **Done** with CSV export; PDF/print, expenses, statements and saved reports pending |
| G6 | Listing quick view, gallery lightbox, virtual tour | `public/partials/quick-view`, `gallery`, `properties/partials/virtual-tour` | Quick view and lightbox **done**; virtual tour pending (schema + storage) |
| G7 | Platform admin "enter organization" context | `PlatformContext`, `app.platform.context.exit` | **Done** 24 Oct 2026 (ADR-N010) |
| G8 | English/Kiswahili switcher and translated phrases | `x-rf.language-switcher`, `Phrases` | **Partly done**: public site, sign-in, shell, homes, dashboard, community. Staff list/detail, platform, reports and invitation pages still English (M4) |
| G9 | Backups, verification and restore commands | `BackupCommand`, `VerifyBackupCommand`, `RestoreBackupCommand` | M5 — likely provider-managed |
| G10 | Account WhatsApp message history | `account/whatsapp-messages` | Depends on G4 |
| G11 | Platform detail screens: organization, user, payment, incident | `platform/{organizations,users,payments,incidents}/show` | **Done** 24 Oct 2026 |

## 5. Not planned for port

Developer-only Artisan commands (`AttachTestLeasesCommand`, `LoadTestDataCommand`, `AuditTranslationsCommand`, `SendTestSmsCommand`, `SendTestWhatsAppCommand`, `ListWhatsAppTemplatesCommand`, `CheckDeploymentCommand`) are replaced by seed scripts and health endpoints. Record an ADR if any become product requirements.
