# Module 12 — Reporting & Audit

## Goal

Provide trustworthy, scoped operational insight and immutable evidence for material business actions.

## Scope

- Operational reports.
- CSV export.
- Future PDF/print output where required.
- Audit history by resource/action.
- Organization and platform reporting.
- Payment, lease, occupancy, maintenance and activity summaries.
- Saved report definitions only if required by parity.

## Primary routes

- `/app/reports`
- `/app/reports/export`
- audit surfaces embedded in detail/platform pages

## Business rules

- Reports read authoritative persisted data.
- Organization reports never include another organization's records.
- Supervisor/tenant access remains restricted to permitted scope.
- Exports neutralize formula injection and preserve exact money/date meaning.
- Material state transitions write audit evidence with actor, resource and timestamp.
- Audit history is not silently editable by normal product flows.

## Data requirements

- Audit log.
- Report-specific source records.
- Optional saved report metadata.
- Export metadata where operationally useful.

## UI states

- Report catalog.
- Report filters and run state.
- Empty/unavailable report state.
- Responsive result table/cards.
- CSV export action.
- Audit list on resource/platform screens.
- Charts only where data actually supports them.

## Remaining implementation

1. Execute all existing report runners against PostgreSQL.
2. Implement missing report types only after schema/data sources exist: expenses, statements, scorecard/controls/saved reports as applicable.
3. Add charts from shared chart components where useful.
4. Audit every material mutation path and close missing coverage.
5. Add report scope/security integration tests.
6. Add export contract tests for large/edge datasets.

## Test plan

- organization scope;
- supervisor/tenant restricted scope;
- money totals and counts against fixtures;
- CSV quoting/formula protection;
- material mutations create audit evidence;
- unauthorized audit/report access denied;
- Playwright run/export report journey.

## Exit criteria

- Reports reconcile to authoritative database fixtures.
- Critical transitions have audit evidence.
- Exports are safe and scoped.
