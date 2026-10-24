# Testing Strategy

## Layers

1. Domain unit tests with Vitest (`*.test.ts` next to the code).
2. Application/repository integration tests against a disposable PostgreSQL database — **not set up yet** (`ROADMAP.md` M2).
3. Route/webhook contract tests for `/api/v1/*` and `/api/webhooks/*` — not set up yet.
4. Playwright role journeys — not installed yet.

Vitest has no `@/` path alias configured; tests import with relative paths.

## Current coverage (24 October 2026 — 57 tests)

| Area | File | Covers |
|---|---|---|
| Lease state, listing, exact payment | `src/domain/rentflow.test.ts` | T-14 renewal window, grace after end, active blocks listing, exact amount, duplicate confirmation no-op |
| Listing eligibility | `src/domain/listing-eligibility.test.ts` | protected states blocked; only published + enabled units listable |
| Renewal planning | `src/domain/renewal.test.ts` | successor boundary, renewal in grace, early renewal rejected, 3/6-month and whole-TZS rules |
| Authorization matrix | `src/server/auth/authorization.test.ts` | tenant and supervisor surface limits, portfolio roles |
| Phone normalization | `src/server/auth/phone.test.ts` | local/international/9-digit input, masking |
| Snippe webhook | `src/server/payments/snippe.test.ts` | HMAC acceptance, stale signature rejection, event mapping |
| Private storage | `src/server/storage/private-object-store.test.ts` | unconfigured store never fabricates URLs or accepts writes |
| Public filters | `src/lib/listing-filters.test.ts` | query parsing, filter/sort, URL building |
| Role navigation | `src/lib/navigation.test.ts` | tenant/supervisor exclusions, platform vs organization context, active-path matching |
| Lease milestones (Laravel timing) | `src/domain/rentflow.test.ts` | EAT day boundaries, grace on end date, expiry after end+7, forward-only |
| Tenant journey | `src/domain/tenant-journey.test.ts` | next step per state, exception never paid, countdown urgency, lease rail |
| Lease reminders | `src/domain/lease-reminders.test.ts` | EAT today, renewal/term-ending/grace templates, dedupe key, wording |
| CSV export | `src/lib/csv.test.ts` | quoting, formula-injection neutralising |
| Translations | `src/i18n/*.test.ts` | catalog lookup and fallback, placeholders, client phrase list freshness, Kiswahili coverage for UI and domain wording |

## Mandatory high-risk coverage

| Requirement | State |
|---|---|
| public availability eligibility | Unit-tested; DB test pending |
| cross-tenant / cross-organization access denial | Pending (needs DB) |
| 3/6 month term validation | Unit-tested |
| T-14 / end / T+7 transitions | Unit-tested with Laravel day semantics; cron uses conditional updates; DB retry test pending |
| exact payment matching | Unit-tested |
| duplicate callback idempotency | Domain no-op tested; webhook + DB test pending |
| partial/mismatched payment exception | Domain tested; reconciliation DB test pending |
| private agreement authorization | Pending (needs DB + storage) |
| supervisor property scope | Matrix tested; resource scope DB test pending |
| maintenance transitions | Pending |
| scheduler catch-up/retry safety | Pending |

## Release gate

`npm run typecheck && npm run lint && npm test && npm run build` must pass before a PR to `main` or a production deploy. CI runs all four; adding a PostgreSQL service is part of `ROADMAP.md` M2.
