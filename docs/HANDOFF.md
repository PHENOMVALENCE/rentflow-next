# RentFlow Next Handoff

## Production deployment

Vercel project: `rentflow-next`

Production URL: `https://rentflow-next.vercel.app`

GitHub: `PHENOMVALENCE/rentflow-next`

## Current delivered slice

The application currently provides a deployable Next.js product vertical covering public discovery and all major operational navigation surfaces. Domain functions and tests encode critical lease, availability and payment invariants. Prisma defines the intended PostgreSQL persistence model.

## Infrastructure still required for transactional production use

1. Attach a dedicated PostgreSQL database and set `DATABASE_URL`.
2. Apply Prisma migrations and seed/reference data.
3. Configure production authentication and `AUTH_SECRET`.
4. Configure Snippe credentials/webhook secret before real payment initiation.
5. Configure SMS/WhatsApp provider credentials before outbound messaging.
6. Configure private document storage before agreement uploads.

Until those provider resources are configured, the deployed UI uses synthetic demonstration data and does not claim external-provider transactions are real.

## Health check

`GET /api/health`

## Scheduler

Vercel Cron invokes `/api/cron/leases`. The endpoint is retry-safe scaffolding until the persistent lease repository is connected.

## Safety

Never paste production credentials into GitHub issues, commits, screenshots or documentation.