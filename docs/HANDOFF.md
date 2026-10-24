# RentFlow Next Handoff

**Last reviewed:** 24 October 2026

## Where things live

- GitHub: `PHENOMVALENCE/rentflow-next` — implementation on `codex/masterchanges`, releases on `main`.
- Vercel project: `rentflow-next` — production URL `https://rentflow-next.vercel.app`.
- Laravel reference: `PHENOMVALENCE/RentFlow`.

## Current state

See `ROADMAP.md` §1 for the up-to-date summary. In short: every major Laravel surface has a Next.js route and most write paths exist in code, but **no database has been attached and no Prisma migration exists**, so nothing is validated against PostgreSQL yet.

Without `DATABASE_URL` the app runs in demo mode: read pages show synthetic data, the session is a demo platform admin, and write paths that need the database are disabled or explain why. Demo mode never fabricates provider results (ADR-N005).

## Deployments

Vercel Git deployments are disabled (`vercel.json` → `git.deploymentEnabled: false`). Merging to `main` does **not** deploy. Production is deployed manually and only on explicit request — follow `DEPLOYMENT.md`. The production URL may therefore show an older build than `main`.

## Infrastructure required for transactional use

1. PostgreSQL + `DATABASE_URL`, then the first reviewed migration (`ROADMAP.md` M1).
2. `AUTH_SECRET` and bootstrap variables for `npm run db:seed`.
3. `CRON_SECRET` for `/api/cron/leases`.
4. Private object storage adapter (`PRIVATE_STORAGE.md`).
5. Snippe API key, webhook secret and callback URL.
6. Briq OTP credentials; notification SMS/WhatsApp only after the provider decision.

## Health and scheduling

- `GET /api/health` (liveness) and `GET /api/health/readiness`.
- Vercel Cron calls `/api/cron/leases` daily at 01:15 **UTC** (04:15 EAT). Laravel ran the equivalent at 01:15 EAT — confirm the intended time before production. The endpoint is idempotent and requires `Authorization: Bearer $CRON_SECRET`.

## Safety

Never paste production credentials into GitHub issues, commits, screenshots or documentation.
