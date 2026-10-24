# RentFlow Next Implementation Roadmap

**Last reviewed:** 24 October 2026 · branch `codex/masterchanges`

This is the single source for **what is done, what is next and what blocks release**. Per-capability evidence lives in `PARITY_MATRIX.md`; infrastructure readiness lives in `FEATURE_DELIVERY_RECORD.md`. When those documents and this roadmap disagree, fix the roadmap in the same commit.

## 1. Where the project stands

| Dimension | State |
|---|---|
| Laravel capability coverage | Every Laravel staff, tenant, supervisor, platform and public list screen has a Next.js route; remaining gaps are listed in §4. |
| Visual parity | Laravel CSS and component markup ported (see `DESIGN_SYSTEM.md`). Public home, listing detail, auth flows, shell and dashboard rebuilt; other screens render through the compatibility layer. |
| Domain rules | Lease states, T-14 renewal, grace, listing eligibility, renewal planning and exact payment matching are pure functions with unit tests (`src/domain`). |
| Persistence | Prisma schema has 44 models. **No migration has been generated or applied.** Known schema gaps are in `SCHEMA_PARITY_GAPS.md`. |
| Runtime mode | Without `DATABASE_URL` the app runs in demo mode with synthetic read data and a demo platform-admin session. Write paths require the database. |
| Quality gates | `typecheck`, `lint`, `test` (32 unit tests) and `next build` pass locally. CI runs typecheck, test and build. No integration or Playwright tests exist yet. |
| Release | `main` is behind `codex/masterchanges`. Vercel Git deployments are disabled (`vercel.json`); production deploys are manual (see `DEPLOYMENT.md`). |
| Validated parity | **None.** No row in `PARITY_MATRIX.md` is `PARITY` because no capability has been exercised end-to-end against PostgreSQL. |

## 2. Milestones

Milestones are sequential gates. Work inside a milestone can run in parallel; a milestone closes only when its exit gate is met with evidence recorded in `PARITY_MATRIX.md`.

### M1 — Persistence foundation · *next*

Goal: a real database underneath the existing code.

1. Attach a development PostgreSQL database (approval required for anything billable — see `OPEN_DECISIONS.md`).
2. Resolve the schema gaps that affect identity first: dedicated `pinHash`/`pinSetAt`, normalized unique phone (`SCHEMA_PARITY_GAPS.md` §1).
3. Generate the initial Prisma migration; review the SQL; commit it under `prisma/migrations`.
4. Run `npm run db:seed` with bootstrap variables and sign in with phone + PIN.
5. Replace the silent 404 on organization-only pages (attachment requests, operational documents, organization, standard leases) with an explanatory state when the session has no organization. This currently affects demo mode and platform admins (see G7).

**Exit gate:** migration committed and applied to a disposable database; bootstrap admin can sign in; `npm run build` passes against it.

### M2 — Verify the critical paths

Goal: turn "code exists" into evidence for the nine critical parity gates.

1. Add repository/integration tests against a disposable PostgreSQL instance (Vitest + test database) for: organization isolation, supervisor scope, tenant self-scope, listing eligibility re-checks, lease creation 3/6-month rule, renewal successor creation, cron transition idempotency, webhook duplicate/mismatch handling, private document authorization.
2. Add Playwright and the minimum role journeys from `TESTING.md`.
3. Add CI services for PostgreSQL and run `lint` in CI.
4. Mark parity rows `PARITY` only when automated tests and a role walkthrough are recorded.

**Exit gate:** all nine critical gates in `PARITY_MATRIX.md` have automated evidence.

### M3 — Close functional gaps

Goal: features Laravel has that Next.js does not (see §4, items G1–G11). Ordered by user impact:

1. Tenant and supervisor home screens (G1), unattached-account home (G2).
2. Lease reminders schedule (G3) and outbound notification delivery (G4).
3. Report generation and exports from the report catalog (G5).
4. Listing quick view, photo lightbox and virtual tour (G6).
5. Platform-admin organization context (G7) and platform detail screens (G11).
6. Remaining items as capacity allows.

**Exit gate:** every gap is either implemented with tests or recorded as `INTENTIONALLY_CHANGED` with an ADR.

### M4 — Visual and UX parity sweep

Goal: replace compatibility-layer rendering with ported Laravel markup, screen by screen.

1. Port remaining screens in this order: properties → units/buildings → tenants → leases/pay/receipts → maintenance → notices/safety/community → reports → platform console.
2. Each screen: loading, empty and error states; keyboard focus; 390px and 1440px screenshots compared with Laravel.
3. Decide on bilingual support (English/Swahili) — Laravel ships a language switcher (G8).

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

| ID | Gap | Laravel reference | Milestone |
|---|---|---|---|
| G1 | Dedicated tenant and supervisor home screens; Next uses one dashboard with role-specific metrics | `livewire/app/home-tenant`, `home-supervisor` | M3 |
| G2 | Home for accounts not yet attached to an organization | `livewire/app/home-pending` | M3 |
| G3 | Daily lease reminder sends (08:00 EAT); Next cron only advances lease state and writes in-app notifications | `SendLeaseRemindersCommand` | M3 |
| G4 | Outbound delivery: inquiry email, platform alert email, tenant SMS copy, SMS and WhatsApp jobs. Adapters exist but are not wired into workflows | `app/Jobs/*`, `app/Notifications/*` | M3 / M5 |
| G5 | Report generation and PDF/print/sheet export; Next has the catalog (`report-catalog.ts`) but the reports page shows metrics only | `livewire/app/reports`, `reports/document.blade.php` | M3 |
| G6 | Listing quick view, gallery lightbox, virtual tour (no tour field in schema) | `public/partials/quick-view`, `gallery`, `properties/partials/virtual-tour` | M3 |
| G7 | Platform admin "enter organization" context; Next shows platform and organization navigation together (provisional, ADR-N009) | `PlatformContext`, `app.platform.context.exit` | M3 |
| G8 | English/Swahili language switcher and translated phrases | `x-rf.language-switcher`, `Phrases` | M4 |
| G9 | Backups, verification and restore commands | `BackupCommand`, `VerifyBackupCommand`, `RestoreBackupCommand` | M5 |
| G10 | Account WhatsApp message history | `account/whatsapp-messages` | M3 |
| G11 | Platform detail screens: organization, user, payment and incident pages (Next has list views only) | `platform/{organizations,users,payments,incidents}/show` | M3 |

## 5. Not planned for port

Developer-only Artisan commands (`AttachTestLeasesCommand`, `LoadTestDataCommand`, `AuditTranslationsCommand`, `SendTestSmsCommand`, `SendTestWhatsAppCommand`, `ListWhatsAppTemplatesCommand`, `CheckDeploymentCommand`) are replaced by seed scripts and health endpoints. Record an ADR if any become product requirements.
