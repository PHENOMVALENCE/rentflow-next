# Module 15 — Data Migration & Cutover

## Goal

Move authoritative production data from Laravel into RentFlow Next safely, reconcile it, validate role journeys and switch production with a rollback path.

## Scope

- Laravel table/model inventory.
- Laravel → Prisma field mapping.
- Data cleaning/normalization rules.
- Idempotent import scripts.
- File/document migration where required.
- Count and financial reconciliation.
- Role-based acceptance testing.
- Freeze/final import/DNS cutover.
- Rollback and read-only Laravel fallback.

## Migration sequence

1. Freeze target Prisma schema for cutover scope.
2. Export representative Laravel snapshot.
3. Build deterministic mapping per table/model.
4. Import parent/reference records first.
5. Import users, organizations and memberships.
6. Import properties/buildings/units and supervisor assignments.
7. Import tenants/tenancies/leases.
8. Import payment obligations, transactions, receipts and exceptions.
9. Import documents/storage references.
10. Import maintenance, notices/community, notifications and audit where retained.
11. Reconcile counts, status distributions and money totals.
12. Run role-based acceptance on imported data.
13. Perform production freeze + final delta/final import.
14. Switch traffic/DNS.
15. Monitor critical flows and retain rollback window.

## Import requirements

- Idempotent: rerunning does not duplicate rows.
- Deterministic identity mapping.
- Transaction boundaries for tightly related records.
- Explicit failure report; no silent record drops.
- Monetary values reconcile exactly.
- Timezone/date conversion is documented.
- Password/PIN migration does not weaken credential security; force reset where incompatible.

## Reconciliation checklist

- organizations;
- users by role;
- properties/buildings/units;
- active/protected/vacant unit counts;
- tenants and active relationships;
- leases by lifecycle state;
- total obligations and verified payments by currency;
- receipts and exceptions;
- supervisors/assignments;
- open maintenance requests;
- private documents/accessibility.

## Acceptance journeys

- platform admin enters organization;
- landlord views portfolio and creates/edits a safe record;
- tenant signs in and sees correct current lease/payment/document state;
- supervisor sees only assigned properties;
- public visitor sees only genuinely available listings;
- payment callback reconciles an imported obligation safely;
- scheduled lease processing works on imported dates.

## Cutover blockers

Do not cut over with an open P0/P1 defect in:

- authentication;
- organization/resource authorization;
- public listing eligibility;
- lease lifecycle;
- payment reconciliation;
- private document access;
- data reconciliation.

## Rollback

- Freeze Laravel writes only for the planned final-import window.
- Keep the Laravel system available read-only during the rollback window.
- Record exact DNS/deployment switch procedure.
- Define which system becomes authoritative if rollback occurs after new Next.js writes.
- Never attempt an unplanned bidirectional merge without an explicit reconciliation procedure.

## Exit criteria

- Production snapshot imports cleanly and repeatably.
- Counts and money totals reconcile to agreed tolerances (money should be exact).
- All critical role journeys pass on migrated data.
- Cutover and rollback runbooks have been rehearsed.
