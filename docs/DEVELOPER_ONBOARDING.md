# Developer Onboarding

## Start here

Read `AGENTS.md`, `PROJECT.md`, `docs/ROADMAP.md` and `docs/README.md` in that order.

## Local setup

```bash
git clone https://github.com/PHENOMVALENCE/rentflow-next.git
cd rentflow-next
git checkout codex/masterchanges
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

`--legacy-peer-deps` matches CI; plain `npm install` can fail resolving optional peer dependencies.

### Demo mode

With `DATABASE_URL` empty the app runs in demo mode: read pages use `src/lib/demo-data.ts`, the session is a demo platform admin, and database writes are unavailable. Pages that require an organization (attachment requests, operational documents, organization, standard leases) explain that demo mode has no organization. Demo mode must never fake provider success (ADR-N005).

To preview another role's screens, set `DEMO_ROLE` to `LANDLORD`, `PROPERTY_ADMIN`, `SUPERVISOR` or `TENANT`. Demo pages read no cookies or session, so a production build (`next build`) prerenders them with the role present **at build time**. Set it for both build and start, or use `next dev`.

### Translations

The UI is English by default with a Kiswahili toggle (ADR-N011). Wrap user-facing text with `t("English sentence")` (server: `getTranslator()` from `@/i18n/server`; client: `useI18n()` from `@/i18n/client`). After adding phrases to a client component, run `node scripts/extract-client-phrases.mjs`. If `npm test` reports a phrase without Kiswahili, add it to `src/i18n/sw.extra.json`. Never edit `src/i18n/sw.json`; it is generated from the Laravel catalog.

### Database mode

Set `DATABASE_URL`, then `npm run db:generate`. No migration exists yet — creating the first reviewed migration is `ROADMAP.md` M1. Seed a bootstrap organization/admin with the `BOOTSTRAP_*` variables and `npm run db:seed`.

## Code map

- `src/app` — routes and composition
- `src/components` — shared UI (`ui.tsx`, `icons.tsx`, `app-shell.tsx`, `pub/*`)
- `src/domain` — framework-independent business rules
- `src/server/rentflow` — feature read models and server actions
- `src/server/{auth,payments,integrations,storage}` — identity, payments, provider adapters, private storage
- `src/lib` — utilities, demo data, listing filters, role navigation
- `src/styles` — stylesheets ported from Laravel
- `prisma/schema.prisma` — persistent model

## Before changing critical behavior

Check the Laravel reference and add an ADR in `docs/DECISIONS.md` if behavior intentionally changes.

## Quality commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

CI runs typecheck, lint, test and build on pushes to `main` and `codex/masterchanges`, and on PRs to `main`.
