# Module 06 — Leases & Renewals

## Goal

Implement the authoritative 3/6-month lease lifecycle, including activation dependencies, countdown, renewal window, grace and expiry.

## Scope

- Lease creation.
- Lease detail/workspace.
- 3/6-month term validation.
- Lease milestones and countdown.
- Renewal planning/successor creation.
- Grace and expiry processing.
- Scheduled lifecycle cron.
- Tenant next-step presentation.
- Lease reminders.

## Primary routes

- `/app/leases`
- `/app/leases/new`
- `/app/leases/[id]`
- `/api/cron/leases`
- `/api/cron/lease-reminders`

## Core invariants

- Initial and successor terms are exactly 3 or 6 months.
- Lease lifecycle dates use EAT calendar-day semantics matching Laravel.
- Renewal opens 14 days before end.
- Grace begins according to the Laravel baseline and runs through the defined 7-day window.
- State moves forward only.
- Payment confirmation, not browser intent, determines activation where payment is required.
- A successor lease is not created twice under retry/concurrency.
- Protected lease states block public listing eligibility.

## Data requirements

- Lease and term dates/status.
- Tenant/unit relation.
- Renewal/successor link.
- Payment obligation relation.
- Reminder dedupe/evidence.
- Audit events for transitions.

## UI states

- Staff lease register.
- Tenant "My leases" list.
- Create lease form.
- Lease workspace/detail.
- Countdown/renewal rail.
- Renewal/grace/expired states.
- Pay/renew next actions.
- Database-unavailable state during migration phase.

## Remaining implementation

1. Validate lease creation against PostgreSQL transactions.
2. Add DB retry/idempotency tests for cron transitions.
3. Add concurrent successor-creation protection.
4. Complete lease detail and renewal form visual parity.
5. Verify reminder dedupe against database.
6. Wire outbound SMS reminders through notification module.
7. Add full audit coverage for lifecycle transitions.

## Test plan

- 3/6-month validation.
- EAT date-boundary tests.
- T-14 renewal eligibility.
- end/grace/T+7 transitions.
- forward-only transition enforcement.
- cron retry and concurrent execution integration tests.
- successor created exactly once.
- protected state blocks listing.
- Playwright create lease → tenant view → renewal state journey.

## Exit criteria

- Lease lifecycle is deterministic, transactional and retry-safe against PostgreSQL.
- Tenant/staff screens reflect authoritative state.
- Scheduled processing can run repeatedly without duplicate domain effects.
