# Domain Model

## Core entities

Organization, User, Role, Property, Building, Unit, Tenant, Lease, Document, PaymentObligation, PaymentTransaction, Receipt, SupervisorAssignment, MaintenanceRequest, SafetyNotice, Community, PropertyListing and AuditLog.

## Lease states

Recommended canonical states:

`DRAFT → AWAITING_PAYMENT → ACTIVE → RENEWAL_WINDOW → GRACE → RENEWED | EXPIRED | TERMINATED`

A successor renewal is a new lease row linked to its predecessor.

## Availability states

`UNAVAILABLE`, `RESERVED`, `OCCUPIED`, `LISTING_ELIGIBLE`, `LISTED`, `ARCHIVED`.

Availability is derived. A manual listing status cannot override protected occupancy.

## Payment states

Obligation: `PENDING`, `PAID`, `EXCEPTION`, `CANCELLED`.
Transaction: `INITIATED`, `PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `REVERSED`, `EXCEPTION`.

## Maintenance states

`REPORTED → ACKNOWLEDGED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED`, with `REOPENED` when necessary.

## Invariants

- One unit cannot have conflicting active/protected occupancy.
- Lease term months are 3 or 6.
- Currency baseline is TZS.
- Exact obligation must be satisfied before activation/renewal.
- Public listing never contains tenant/payment/household data.
- Supervisor access requires explicit organization/property assignment.
- Audit logs omit secrets and unnecessary personal data.