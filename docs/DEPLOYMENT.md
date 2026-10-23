# Deployment — Vercel

## Production model

GitHub repository `PHENOMVALENCE/rentflow-next` is connected to a Vercel project. Pushes generate deployments; `main` is the production branch.

## Required runtime variables

- `DATABASE_URL` when persistence is enabled
- `AUTH_SECRET` when production authentication is enabled
- provider-specific Snippe/SMS variables only when those adapters are activated
- `CRON_SECRET` for protected scheduled endpoints when configured

Never store secrets in Git.

## Build gate

Run typecheck/tests before release. Vercel handles framework build/deploy; CI handles quality gates.

## Scheduled work

Use Vercel Cron to call protected idempotent route handlers; do not run in-process cron loops.

## Rollback

Use Vercel deployment rollback/promote controls. Database migrations must be backward-compatible for safe rollback.