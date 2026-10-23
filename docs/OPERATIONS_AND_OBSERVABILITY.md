# Operations and Observability

Track: request/runtime errors, provider failures, payment exceptions, scheduler failures, notification failures and authorization anomalies.

Logs must contain safe identifiers and correlation/reference IDs—not secrets or private payload bodies.

Operational dashboards should surface leases entering renewal/grace, payment exceptions, unresolved maintenance, listing blocks and supervisor assignment gaps.

Scheduled tasks and provider callbacks must be retry-safe and idempotent.