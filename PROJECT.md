# RentFlow Next Project Specification

## Mission

RentFlow is a Tanzania-first property and rental operations platform. This repository is the Next.js implementation of the canonical RentFlow product previously implemented in Laravel.

## Operational lifecycle

**Property → Unit → Availability → Tenant → Lease → Agreement → Full-term payment → Active occupancy → Renewal window → Grace → Renewal / Exit / Re-listing**

Maintenance, supervisor operations, notices, notifications, reporting and audit run across that lifecycle.

## Roles

- Public visitor
- Tenant
- Landlord / Property administrator
- Supervisor
- Platform administrator

## Product principles

1. State before decoration.
2. Authoritative server state over UI flags.
3. Mobile-first and low-bandwidth aware.
4. Public/private data separation.
5. Exact full-term payment in MVP.
6. 3- or 6-month initial lease terms.
7. Server-authoritative provider reconciliation.
8. Explicit renewal/grace/expiry transitions.
9. Minimal sensitive household data.
10. Auditability for material operations.

## Target stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Zod
- Vercel
- Vitest + Playwright

## Migration rule

Laravel remains the behavioral reference until a row in `docs/PARITY_MATRIX.md` is validated or an ADR explicitly changes behavior.