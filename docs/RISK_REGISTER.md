# Risk Register

| Risk | Severity | Control |
|---|---|---|
| UI appears complete while backend is synthetic | High | Feature delivery record explicitly distinguishes preview vs production-backed behavior. |
| Payment double-processing | Critical | Idempotent reconciliation + unique provider refs + transactional activation. |
| Partial/mismatched payment activates lease | Critical | Exact amount/currency reconciliation domain rule and tests. |
| Occupied unit exposed publicly | Critical | Derived availability rule; server re-check required before public actions. |
| Cross-tenant data exposure | Critical | Server resource authorization required before persistence rollout. |
| Provider secrets leaked | Critical | Environment-only secrets; no payload/secrets logging. |
| Scheduler repeated execution corrupts state | High | Idempotent transition services required. |
| Migration diverges from Laravel behavior | High | Parity matrix + traceability + ADR control. |
| Database/provider choice incurs unapproved cost | Medium | Do not provision billable production resources without explicit approval. |
