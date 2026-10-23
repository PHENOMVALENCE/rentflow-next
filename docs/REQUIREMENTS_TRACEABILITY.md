# Requirements Traceability

| Requirement | Source | Implementation | Verification | State |
|---|---|---|---|---|
| FR-001/002 Public listings and privacy | Laravel product/UI docs | `/`, `/listings`, `/listings/[id]`; `canListUnit` | Build + domain test | Partial parity |
| FR-003 Authentication/authorization | Laravel policies/session model | Architecture/schema only | Pending | Not complete |
| FR-004 Properties/units | Laravel inventory | `/app/properties`, `/app/units`; Prisma schema | Build | Preview |
| FR-005 Tenants/leases | Laravel tenant/lease workflows | `/app/tenants`, `/app/leases`; Prisma schema | Build | Preview |
| FR-006/007 Lease term/countdown states | Lease lifecycle docs | `src/domain/rentflow.ts` | Vitest | Domain parity partial |
| FR-008 Exact payment obligation | Payment docs | Prisma + reconciliation domain | Vitest | Domain parity partial |
| FR-009/010 Provider initiation/reconcile | Integration docs | adapter boundary specified | Pending credentials/contracts | Not complete |
| FR-011 Renewal/grace | Lease lifecycle | `leaseStateAt` | Vitest | Domain implemented |
| FR-012 Re-listing eligibility | Availability rules | `canListUnit` | Vitest | Domain implemented |
| FR-013 Agreements | Laravel documents | Architecture only | Pending storage | Not complete |
| FR-014 Maintenance | Laravel maintenance | UI + Prisma model | Build | Preview |
| FR-015 Supervisor scope | Laravel assignments | UI + Prisma model | Pending auth integration | Partial |
| FR-016 Notices/community | Laravel communication | UI surface | Build | Preview |
| FR-017 Audit | Laravel audit model | Prisma `AuditLog` | Pending repository | Partial |
| FR-018 Reporting | Laravel reporting | `/app/reports` | Build | Preview |
