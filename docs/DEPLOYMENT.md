# Deployment — Vercel

## Production model

The Vercel project `rentflow-next` is linked to GitHub, but **Git deployments are disabled** (`vercel.json` → `git.deploymentEnabled: false`, ADR-N007). Pushing or merging to `main` does not deploy. Production deploys are manual and only happen on explicit request.

Keep three things distinct when reporting status:

1. the latest commit on `main`;
2. the latest production deployment in Vercel;
3. the deployment currently served on the production domain.

## Required runtime variables

See `.env.example` for the full list.

- `DATABASE_URL` — persistence (absent ⇒ demo mode)
- `AUTH_SECRET` — session signing
- `CRON_SECRET` — protects `/api/cron/leases`
- Snippe, Briq and storage variables only when those adapters are activated

Never store secrets in Git.

## Pre-deploy checklist

1. Deploying from the intended branch and commit (normally `main` after a reviewed PR merge).
2. All intended PRs merged; nothing pending that the release depends on.
3. `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` pass for that commit.
4. Environment variables present for every enabled feature; no debug configuration.
5. Database migrations reviewed and applied **before** code that depends on them.
6. After deploying: confirm the production domain maps to the new deployment and `/api/health` responds.

## Scheduled work

Vercel Cron calls protected, idempotent route handlers (`vercel.json`). Schedules are UTC. Do not run in-process cron loops.

## Rollback

Use Vercel promote/rollback. Migrations must stay backward-compatible with the previous deployment so rollback is safe.
