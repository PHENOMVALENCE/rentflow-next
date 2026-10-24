# Requirements Traceability

**Last reviewed:** 24 October 2026. "Code complete" means the path exists; nothing is validated against PostgreSQL yet (`ROADMAP.md` M1–M2).

| Requirement | Implementation | Verification | State |
|---|---|---|---|
| FR-001/002 Public listings and privacy | `/`, `/listings/[id]`, `public-listing-read-model.ts`, `src/domain/listing-eligibility.ts` | Unit tests (eligibility, filters) | Code complete; DB test pending |
| FR-003 Authentication/authorization | `src/server/auth/*`, `requireSession`, read-model scoping | Unit tests (matrix, phone) | Code complete; cross-scope DB tests pending |
| FR-004 Properties/units | `/app/properties/**`, `/app/[section]`, `property-actions.ts`, `listing-actions.ts` | Build | Code complete |
| FR-005 Tenants/leases | `/app/tenants/**`, `/app/leases/**`, `tenant-actions.ts`, `lease-creation.ts` | Build | Code complete |
| FR-006/007 Lease term/countdown | `src/domain/{rentflow,renewal}.ts`, `/app/leases/[id]` | Unit tests | Code complete |
| FR-008 Exact payment obligation | `lease-creation.ts`, `reconcileExactPayment` | Unit tests | Code complete |
| FR-009/010 Provider initiation/reconcile | `server/payments/*`, `/api/webhooks/payments/snippe` | Webhook signature tests | Code complete; sandbox + idempotency DB tests pending |
| FR-011 Renewal/grace | `leaseStateAt`, `/api/cron/leases`, `renewal-actions.ts` | Unit tests | Code complete; cron time to confirm (UTC vs EAT) |
| FR-012 Re-listing eligibility | `canListUnit`, listing eligibility | Unit tests | Code complete |
| FR-013 Agreements | `/app/agreements/**`, `/api/documents/[id]/download`, `document-access.ts` | Storage contract tests | Blocked on private storage |
| FR-014 Maintenance | `/app/maintenance/**`, `maintenance-actions.ts` | Build | Code complete; transition tests pending |
| FR-015 Supervisor scope | `supervisor-actions.ts`, scoped read models, `src/lib/navigation.ts` | Unit tests (matrix, nav) | Code complete; resource-scope DB tests pending |
| FR-016 Notices/community | `/app/notices/**`, `/app/safety/**`, `/app/community/**` | Build | Code complete in-app; outbound delivery missing (G4) |
| FR-017 Audit | `AuditLog` writes in actions, `audit-read-model.ts`, `/app/reports/audit` | Build | Code complete; coverage audit pending |
| FR-018 Reporting | `/app/reports`, `report-catalog.ts` | Build | Partial — generation/export missing (G5) |
