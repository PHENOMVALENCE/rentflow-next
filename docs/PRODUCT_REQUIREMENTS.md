# Product Requirements

## MVP capabilities

1. Role-aware authentication and server authorization.
2. Organizations, geography, properties and units.
3. Public discovery of truly listable units.
4. Tenant onboarding and occupancy relationship.
5. 3/6-month lease lifecycle.
6. Existing agreement document access.
7. Lease countdown and renewal milestones.
8. Exact full-term payment obligation.
9. Snippe-compatible payment adapter/reconciliation boundary.
10. T-14 renewal and 7-day grace workflow.
11. Re-listing eligibility after protected occupancy ends.
12. Maintenance request lifecycle.
13. Supervisor property assignment and scoped access.
14. Notices/community communication.
15. Notifications, audit and operational reporting.

## Public requirements

Public pages expose only approved listing information. An inquiry never reserves a unit. Every public action re-checks listing eligibility.

## Tenant requirements

Tenant Home prioritizes unit identity, lease state/countdown, exact payment status/action, supervisor contact, agreement, maintenance, notices and receipts.

## Admin requirements

Admin can manage properties, units, tenants, leases, listings, payment exceptions, supervisors, maintenance, notices and reports within organization scope.

## Supervisor requirements

Supervisor sees only assigned operational scope and appropriate contacts/tasks—not unrestricted portfolio financial/private data.

## Payment requirements

Payment amount is fixed. Provider callbacks are validated and reconciled idempotently. Duplicate callbacks have no duplicate domain effect. Amount/reference/currency mismatches become exceptions.

## Non-goals

No credit scoring, lending, escrow, invented legal clauses, PIN storage, native mobile app requirement or premature microservices.