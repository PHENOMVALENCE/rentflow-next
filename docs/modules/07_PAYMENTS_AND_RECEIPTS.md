# Module 07 — Payments & Receipts

## Goal

Make payment obligations, provider reconciliation, exceptions and receipts authoritative, exact and idempotent.

## Scope

- Full-term payment obligation creation.
- Payment initiation.
- Snippe adapter.
- Webhook verification and reconciliation.
- Payment exceptions.
- Unpaid terms.
- Pay screen.
- Receipts and receipt detail.
- Settlement evidence.

## Primary routes

- `/app/leases/[id]/pay`
- `/app/payments`
- `/app/payments/[id]`
- `/app/payment-exceptions`
- `/app/unpaid-terms`
- `/app/receipts`
- `/app/receipts/[id]`
- `/api/webhooks/payments/snippe`

## Core invariants

- Payment amount is the exact full-term obligation.
- Partial, wrong-currency, wrong-reference or mismatched payments do not activate/renew a lease.
- Browser/provider redirect success is not authoritative.
- Trusted server-side reconciliation is authoritative.
- Duplicate callbacks have no duplicate domain effect.
- Reconciliation and lease activation/renewal occur transactionally.
- Receipt evidence exists only for confirmed settlement.

## Data requirements

- Payment obligation.
- Internal reference.
- Provider attempt/reference.
- Requested and received amount/currency.
- Transaction/reconciliation status.
- Exception reason/evidence.
- Receipt number and issued timestamp.
- Audit records.

## UI states

- Fixed payment amount and obligation summary.
- Initiating/provider pending state.
- Confirmed payment state.
- Mismatch/exception state.
- Unpaid-term list.
- Receipt search/list.
- Receipt slip/detail with settlement evidence.

## Remaining implementation

1. Attach real PostgreSQL and test obligation persistence.
2. Run Snippe sandbox initiation + callback flow.
3. Add duplicate callback DB test.
4. Add mismatch/partial/currency exception DB tests.
5. Verify transactional activation/renewal behavior.
6. Complete payment detail/exception UX parity.
7. Add printable/PDF receipt behavior only if Laravel/product requires it.
8. Add failure alerting for webhook/reconciliation errors.

## Test plan

- Exact amount rule unit test.
- Signed webhook freshness/signature tests.
- Duplicate event idempotency integration test.
- Partial/wrong-reference/wrong-currency integration tests.
- Concurrent webhook processing test.
- Receipt generated only after confirmation.
- Playwright tenant pay → confirmed receipt journey using sandbox/test provider path.

## Exit criteria

- A real provider callback can confirm a valid obligation exactly once.
- Invalid/mismatched payment cannot change lease state.
- Receipts and exception screens are derived from persisted reconciliation evidence.
