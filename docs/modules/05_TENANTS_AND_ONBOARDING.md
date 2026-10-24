# Module 05 — Tenants & Onboarding

## Goal

Manage tenant identity, tenancy relationships, attachment requests and onboarding without exposing one tenant's data to another.

## Scope

- Tenant records.
- Tenant create/detail flows.
- Portfolio import.
- Attachment/document requests.
- Tenant profile onboarding.
- Lease onboarding handoff.
- Tenancy/rental relationship state.
- Tenant home data inputs.

## Primary routes

- `/app/tenants`
- `/app/tenants/new`
- `/app/tenants/[id]`
- `/app/tenants/import`
- `/app/attachment-requests`
- `/app/onboarding/profile`
- `/app/onboarding/lease`

## Data requirements

- Tenant user/profile.
- Organization-scoped tenant record.
- Unit/property relationship through tenancy/lease.
- Contact and onboarding metadata.
- Attachment request state.
- Import evidence/results.

## Business rules

- Tenant self-scope is enforced server-side.
- Staff can access only organization tenants.
- Supervisors see tenants only through assigned property scope.
- Imported tenant data must pass the same validation and organization rules as manual creation.
- Tenant onboarding does not establish paid occupancy by itself.

## UI states

- Tenant directory/cards.
- Tenant create/edit/detail.
- Import mapping/result summary.
- Attachment request queue.
- Tenant profile onboarding.
- Pending lease/payment next-step state.
- Empty/error/permission states.

## Remaining implementation

1. Validate create/edit/import against PostgreSQL.
2. Add supervisor resource-scope DB tests.
3. Add tenant self-scope DB tests.
4. Complete attachment request workflows and visual parity.
5. Complete imported-record error reporting.
6. Finish translations across staff tenant/detail/onboarding screens.

## Test plan

- Cross-tenant denial.
- Cross-org staff denial.
- Supervisor assigned/unassigned property access.
- Import validation and partial failure evidence.
- Tenant onboarding state transition tests.
- Playwright admin create tenant and tenant onboarding journeys.

## Exit criteria

- Tenant records and onboarding work against real persistence.
- Scope boundaries are proven with DB tests.
- Lease module can consume tenant relationships without ambiguity.
