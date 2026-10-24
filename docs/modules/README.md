# RentFlow Next — Module Documentation Index

Use this folder as the implementation specification set for completing RentFlow Next module by module.

## Execution order

1. [`00_FOUNDATION_AND_DESIGN_SYSTEM.md`](./00_FOUNDATION_AND_DESIGN_SYSTEM.md)
2. [`01_IDENTITY_AND_ACCESS.md`](./01_IDENTITY_AND_ACCESS.md)
3. [`02_ORGANIZATIONS_AND_GEOGRAPHY.md`](./02_ORGANIZATIONS_AND_GEOGRAPHY.md)
4. [`03_PROPERTIES_AND_UNITS.md`](./03_PROPERTIES_AND_UNITS.md)
5. [`04_PUBLIC_DISCOVERY_AND_INQUIRIES.md`](./04_PUBLIC_DISCOVERY_AND_INQUIRIES.md)
6. [`05_TENANTS_AND_ONBOARDING.md`](./05_TENANTS_AND_ONBOARDING.md)
7. [`06_LEASES_AND_RENEWALS.md`](./06_LEASES_AND_RENEWALS.md)
8. [`07_PAYMENTS_AND_RECEIPTS.md`](./07_PAYMENTS_AND_RECEIPTS.md)
9. [`08_DOCUMENTS_AND_PRIVATE_STORAGE.md`](./08_DOCUMENTS_AND_PRIVATE_STORAGE.md)
10. [`09_SUPERVISORS_AND_SCOPE.md`](./09_SUPERVISORS_AND_SCOPE.md)
11. [`10_MAINTENANCE.md`](./10_MAINTENANCE.md)
12. [`11_COMMUNICATIONS_AND_NOTIFICATIONS.md`](./11_COMMUNICATIONS_AND_NOTIFICATIONS.md)
13. [`12_REPORTING_AND_AUDIT.md`](./12_REPORTING_AND_AUDIT.md)
14. [`13_PLATFORM_ADMINISTRATION.md`](./13_PLATFORM_ADMINISTRATION.md)
15. [`14_INTEGRATIONS_AND_OPERATIONS.md`](./14_INTEGRATIONS_AND_OPERATIONS.md)
16. [`15_DATA_MIGRATION_AND_CUTOVER.md`](./15_DATA_MIGRATION_AND_CUTOVER.md)

## How to use each module document

Each file defines:

- module goal;
- routes/surfaces;
- data requirements;
- domain/business rules;
- UI states;
- remaining implementation;
- automated verification plan;
- production exit criteria.

Implementation status itself belongs in `../ROADMAP.md` and parity evidence belongs in `../PARITY_MATRIX.md`.

## Completion labels

Use these consistently when discussing module progress:

- **UI PRESENT** — user-facing surface exists.
- **CODE COMPLETE** — application/domain/persistence paths exist.
- **INTEGRATION VERIFIED** — real database/provider/storage behavior is tested.
- **PRODUCTION READY** — deployment, observability, acceptance and recovery evidence exist.

A module may have substantial UI and still remain incomplete until integration and production gates are met.
