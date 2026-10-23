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

**Status:** Accepted

GitHub `main` deploys to Vercel. Scheduled work is triggered with protected Vercel Cron endpoints and remains idempotent.

## ADR-N005 — No fabricated provider success

**Status:** Accepted

Until Snippe/SMS/storage credentials are connected, preview data remains explicitly synthetic. UI completion must not be presented as real payment, authentication or document-provider completion.