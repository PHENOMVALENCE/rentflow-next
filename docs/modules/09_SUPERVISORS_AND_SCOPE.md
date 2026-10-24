# Module 09 — Supervisors & Scope

## Goal

Allow operational delegation by property while strictly limiting supervisors to assigned scope and appropriate data.

## Scope

- Supervisor invitation and acceptance.
- Supervisor directory/manage screen.
- Property assignment/removal.
- Supervisor home.
- Scoped tenants, maintenance, notices/community and operational contacts.
- Restricted finance/private-data visibility.

## Primary routes

- `/app/supervisors/create`
- `/app/supervisors/manage`
- `/supervisors/accept`
- supervisor role home under `/app`

## Core rules

- A supervisor belongs to the correct organization.
- Supervisor resource access derives from property assignment.
- Unassigned properties/tenants/maintenance are denied server-side.
- Supervisors do not receive unrestricted organization finance or sensitive tenant information.
- Assignment changes take effect immediately for subsequent authorization checks.

## Data requirements

- Supervisor user/membership.
- Property assignment relation.
- Invitation lifecycle.
- Audit evidence for assignment changes.

## UI states

- Invite supervisor.
- Pending/accepted invitation.
- Manage assignments.
- Supervisor role home with assigned scope.
- Empty state when no properties are assigned.
- Permission denied for out-of-scope resources.

## Remaining implementation

1. Add DB-backed assignment scope tests.
2. Verify all read models/actions resolve supervisor property IDs consistently.
3. Complete assignment management UI parity and translations.
4. Audit assignment add/remove and invitation acceptance.
5. Add role journey for supervisor maintenance and tenant visibility.

## Test plan

- Assigned property access allowed.
- Unassigned property access denied.
- Cross-organization supervisor denied.
- Finance/private document routes remain inaccessible unless explicitly permitted.
- Assignment removal immediately revokes access.
- Playwright supervisor invitation → acceptance → scoped home journey.

## Exit criteria

- Supervisor scope is enforced by resource-level DB evidence, not only a permission matrix.
- Operational modules can safely reuse supervisor scoping helpers.
