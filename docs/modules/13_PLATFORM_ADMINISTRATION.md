# Module 13 — Platform Administration

## Goal

Provide safe cross-organization operational oversight without bypassing organization/resource policy.

## Scope

- Platform control center.
- Organizations and users.
- Payments and reconciliation.
- Incidents.
- Activity/audit.
- Notifications/delivery status.
- Health and integrations.
- Security, integrity and quality views.
- Analytics/jobs/sessions/settings.
- Enter/exit organization context.

## Primary routes

- `/app/platform`
- `/app/platform/[section]`
- `/app/platform/organizations/[id]`
- `/app/platform/users/[id]`
- `/app/platform/payments/[id]`
- `/app/platform/incidents/[id]`

## Business rules

- Platform role is required for every platform route/action.
- Entering organization context is explicit and audited.
- Organization context must not accidentally widen or retain access after exit.
- Platform actions that mutate organization data still use normal domain invariants.
- Sensitive secrets remain runtime-owned, not editable in the browser.

## Data requirements

- Organization/user summaries.
- Payment and incident records.
- Audit/activity stream.
- Provider/runtime readiness signals.
- Platform context/session state.

## UI states

- Control-center metrics.
- Incident and organization panels.
- Module catalog.
- Section list/detail screens.
- Health/configuration states.
- Entered-organization banner/context controls.

## Remaining implementation

1. Continue replacing compatibility-layer platform screens with current authenticated design primitives.
2. Add platform action authorization integration tests.
3. Verify context enter/exit behavior across routes/actions.
4. Add incident state-transition tests.
5. Complete Kiswahili only where product policy requires platform localization.
6. Connect health/integration sections to production operational evidence.

## Test plan

- non-platform role denied all platform surfaces;
- organization context entry/exit audited;
- context does not leak into unrelated sessions;
- platform mutations preserve domain constraints;
- incident transitions are valid and audited;
- Playwright platform control-center and organization-context journey.

## Exit criteria

- Platform console is operationally useful against production-like data.
- Cross-organization actions remain explicit, auditable and policy-safe.
