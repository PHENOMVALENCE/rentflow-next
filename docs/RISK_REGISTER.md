# Risk Register

**Last reviewed:** 24 October 2026

| Risk | Severity | Control |
|---|---|---|
| UI appears complete while backend is unvalidated | High | `ROADMAP.md` §1 and `PARITY_MATRIX.md` state that no capability is validated; `FEATURE_DELIVERY_RECORD.md` separates code from production readiness. |
| No Prisma migration exists; first migration may fail on real data | High | `ROADMAP.md` M1; migration rules in `SCHEMA_PARITY_GAPS.md` §7. |
| No integration or end-to-end tests | High | `ROADMAP.md` M2; no `PARITY` status without automated evidence. |
| Payment double-processing | Critical | Idempotent reconciliation, unique provider refs, transactional activation; DB tests pending. |
| Partial/mismatched payment activates lease | Critical | Exact amount/currency domain rule with unit tests. |
| Occupied unit exposed publicly | Critical | Derived availability; read model and image route re-check eligibility. |
| Cross-tenant data exposure | Critical | Server authorization and scoped read models; cross-scope DB tests pending. |
| Auto-merge workflow keeps branch side on conflicts and can drop `main` edits | Medium | Merge only at milestone gates after review (`BRANCH_POLICY.md`). |
| Cron runs at 01:15 UTC, not 01:15 EAT as in Laravel | Medium | Confirm intended time before production (`HANDOFF.md`). |
| Demo mode hides missing-organization behaviour (silent 404s) | Medium | `ROADMAP.md` M1 item 5. |
| Provider secrets leaked | Critical | Environment-only secrets; no payload/secret logging. |
| Scheduler repeated execution corrupts state | High | Idempotent transition services; retry test pending. |
| Migration diverges from Laravel behavior | High | Parity matrix, traceability and ADR control. |
| Database/provider choice incurs unapproved cost | Medium | Do not provision billable resources without explicit approval. |
