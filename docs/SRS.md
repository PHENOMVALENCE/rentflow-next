# Software Requirements Specification

## Functional requirements

- FR-001 Public users can browse eligible listings.
- FR-002 Public users can view listing details without private tenancy data.
- FR-003 Users authenticate and are authorized by role/resource scope.
- FR-004 Admins manage properties and units.
- FR-005 Admins manage tenants and leases.
- FR-006 Lease terms support 3 or 6 months and authoritative dates/states.
- FR-007 Tenants see current lease countdown and milestone.
- FR-008 Each lease has one exact full-term payment obligation.
- FR-009 Payment initiation creates an internal reference before provider call.
- FR-010 Provider results reconcile server-side and idempotently.
- FR-011 Renewal opens at T-14; grace baseline is 7 days after end.
- FR-012 Expired unrenewed occupancy can become re-listing eligible.
- FR-013 Existing agreements are privately accessible to authorized users.
- FR-014 Tenants can submit maintenance requests and see status history.
- FR-015 Supervisors operate only in assigned property scope.
- FR-016 Authorized users can receive/publish operational notices.
- FR-017 Material state changes create audit evidence.
- FR-018 Reports derive from authoritative records.

## Non-functional requirements

- NFR-001 Mobile responsive.
- NFR-002 Accessible keyboard/focus semantics.
- NFR-003 Low-bandwidth conscious.
- NFR-004 Secrets never sent to client bundles.
- NFR-005 Critical mutations are transaction-safe/idempotent.
- NFR-006 Protected resources enforce authorization server-side.
- NFR-007 Build/typecheck/tests gate release.
- NFR-008 Production deploys through Vercel Git integration.