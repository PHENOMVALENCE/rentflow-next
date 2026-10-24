# Architecture / Product Decisions

## ADR-N001 — Next.js parity migration

**Status:** Accepted · 23 October 2026

Reimplement RentFlow in Next.js while preserving canonical Laravel product behavior. Behavioral changes require an explicit decision.

## ADR-N002 — App Router modular monolith

**Status:** Accepted

Use one Next.js deployment with domain/application boundaries rather than premature microservices.

## ADR-N003 — PostgreSQL + Prisma target

**Status:** Accepted

Use PostgreSQL persistence with Prisma mappings. Money is Decimal/integer-safe. Provider references and RentFlow references remain separate.

## ADR-N004 — Vercel deployment

**Status:** Superseded by ADR-N007

Original decision: GitHub `main` deploys to Vercel automatically. Scheduled work uses protected, idempotent Vercel Cron endpoints (still in force).

## ADR-N005 — No fabricated provider success

**Status:** Accepted

Until Snippe/SMS/storage credentials are connected, preview data remains explicitly synthetic. UI completion must not be presented as real payment, authentication or document-provider completion.

## ADR-N006 — Laravel stylesheets are the visual source of truth

**Status:** Accepted · 24 October 2026

Port `resources/css/{app,app-ui,public}.css` and the Blade component markup instead of re-designing. React components keep Laravel class names. Deviations are listed in `DESIGN_SYSTEM.md`. A temporary compatibility layer in `globals.css` restyles screens not yet ported; it is removed at the end of `ROADMAP.md` M4.

## ADR-N007 — Manual production deployment

**Status:** Accepted · 24 October 2026 · supersedes ADR-N004

Vercel Git deployments are disabled (`vercel.json` → `git.deploymentEnabled: false`) to stay within the Hobby deployment quota and to separate merging from releasing. Production deploys happen only on explicit request, after the checklist in `DEPLOYMENT.md`. Principle: commit frequently, merge deliberately, deploy intentionally.

## ADR-N008 — Public catalogue on the home page; enquiries inline

**Status:** Accepted · 24 October 2026

Matches Laravel: the catalogue lives at `/` (`#available-units`), and the enquiry form lives on the listing page (`#enquire`). `/listings` and `/listings/[id]/inquire` remain as redirects so existing links keep working.

## ADR-N009 — Platform admin navigation (provisional)

**Status:** Superseded by ADR-N010 · 24 October 2026

Laravel platform operators see only platform navigation and enter an organization through an explicit context switch. Next.js has no context switch yet, so platform admins see platform groups plus organization groups in one sidebar. Replace with the Laravel model when gap G7 is implemented.

## ADR-N010 — Platform organization context

**Status:** Accepted · 24 October 2026 · supersedes ADR-N009

Matches Laravel `PlatformContext`. Outside a context, platform admins see platform navigation only and `/app` redirects to `/app/platform`. **Enter organization** (on the organization detail page) re-issues the session with that `organizationId`, writes `platform.context_entered` to the audit log and switches the sidebar to the organization workspace with a "System admin mode" banner. **Exit organization context** clears the scope and writes `platform.context_exited`.

## ADR-N011 — Translation keyed by English sentences

**Status:** Accepted · 24 October 2026

Mirrors Laravel `App\Support\Phrases`: UI code passes the English sentence to `t()`; a missing translation falls back to English. `src/i18n/sw.json` is generated from Laravel `lang/sw.json` and `lang/{en,sw}/phrases.php` and must not be hand-edited; phrases introduced in RentFlow Next go in `sw.extra.json`. The locale is a cookie (`rf_locale`, default English). Client components receive only the phrases they use (`scripts/extract-client-phrases.mjs`); unit tests fail when that list is stale or a used phrase has no Kiswahili.

