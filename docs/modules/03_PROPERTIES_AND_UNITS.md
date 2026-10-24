# Module 03 — Properties & Units

## Goal

Model the authoritative physical rental portfolio used by listings, tenancies, leases, supervisors, maintenance and reporting.

## Scope

- Properties.
- Buildings where applicable.
- Units/rentable spaces.
- Official address/geography linkage.
- Occupancy derivation.
- Property/unit detail and create/edit flows.
- Property-level operational metadata.
- Unit/listing eligibility inputs.

## Primary routes

- `/app/properties`
- `/app/properties/create`
- `/app/properties/[id]`
- `/app/units`
- unit/building create/edit routes mapped from Laravel

## Data requirements

- Organization-scoped property.
- Building/property relationship.
- Unit number/identifier.
- Rent amount and rentable metadata.
- Geography/address references.
- Authoritative occupancy derived from active/protected lease state.
- Supervisor assignment relationship.
- Listing relationship.

## Business rules

- A unit must belong to the correct organization/property hierarchy.
- Occupancy is derived from authoritative tenancy/lease state, not manually toggled UI state.
- Protected/occupied units cannot become publicly listable merely by changing listing state.
- Deleting or mutating portfolio records must respect active dependencies.

## UI states

- Property portfolio list/table.
- Property create/edit form.
- Property detail with units, occupancy and supervisor context.
- Unit list and unit detail/edit.
- Empty portfolio onboarding state.
- Validation/error states for duplicate or invalid identifiers.

## Remaining implementation

1. Complete dedicated property/unit markup parity beyond compatibility rendering.
2. Validate all create/edit actions against PostgreSQL.
3. Add dependency-aware destructive-action behavior.
4. Add property tile shared component where appropriate.
5. Normalize geography fields according to schema parity plan.
6. Add unit availability and occupancy integration tests.

## Test plan

- Organization isolation.
- Unit→property referential integrity.
- Active lease blocks availability.
- Invalid cross-organization IDs denied.
- Property CRUD and unit CRUD integration tests.
- Playwright property creation → unit creation journey.

## Exit criteria

- Portfolio can be created and maintained entirely against PostgreSQL.
- Occupancy cannot drift from authoritative lease state.
- Listing, lease, supervisor and maintenance modules can rely on property/unit IDs and scope.
