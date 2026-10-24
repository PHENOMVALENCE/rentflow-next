# Module 10 — Maintenance

## Goal

Provide a tenant-to-operations maintenance workflow with explicit state transitions, property scope and immutable history.

## Scope

- Tenant maintenance request creation.
- Staff/supervisor maintenance queues.
- Priority and status lifecycle.
- Assignment/responsibility context.
- Status transition notes.
- Maintenance timeline/history.
- Tenant read-only progress visibility.

## Primary routes

- `/app/maintenance`
- `/app/maintenance/[id]`
- maintenance create route mapped from Laravel

## Business rules

- Tenant can create/view requests only for authorized unit/lease context.
- Staff can access requests only inside organization scope.
- Supervisor access is limited to assigned properties.
- Tenants cannot perform operational state transitions.
- Only allowed next states are offered and accepted.
- Every transition creates immutable timeline/audit evidence.

## Data requirements

- Request title/description/priority/status.
- Tenant, property and optional unit relation.
- Assignment/responsibility where required.
- Status update records with actor/note/timestamp.
- Audit event.

## UI states

- Maintenance queue/cards.
- Request creation form.
- Detail summary.
- Operational transition controls.
- Tenant read-only status.
- Reusable maintenance timeline.
- Empty/error/no-database states.

## Remaining implementation

1. Add maintenance creation parity if any Laravel fields remain missing.
2. Add DB integration tests for transition rules.
3. Verify supervisor and tenant resource scope.
4. Add assignment/resolution metadata if present in Laravel reference.
5. Finish translations and responsive form/detail parity.
6. Wire notifications to transitions through Module 11.

## Test plan

- tenant valid-unit request creation;
- tenant cannot transition state;
- invalid transition rejected;
- supervisor unassigned property denied;
- transition writes status history and audit atomically;
- retry does not create unintended duplicate transition;
- Playwright tenant submit → staff transition → tenant follow-up journey.

## Exit criteria

- Maintenance is fully database-backed and auditable.
- Scope and transition rules have automated evidence.
- Timeline accurately reflects persisted operational history.
