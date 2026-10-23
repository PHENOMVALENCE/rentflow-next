# Feature Delivery Record

This file distinguishes **implemented in code**, **demoable without infrastructure**, and **production-backed** capabilities. A feature is not production-complete merely because its code path exists.

| Capability | UI/read path | Domain/write path | Persistence-ready | External dependency | Current status |
|---|---:|---:|---:|---|---|
| Public home/listings/detail | Yes | Yes | Yes | None | Repository-backed with demo fallback |
| Public property inquiries | Yes | Yes | Yes | None | Implemented; DB required to persist |
| Application shell | Yes | N/A | Yes | None | Role-aware; authenticated when DB enabled |
| Authentication/RBAC | Yes | Yes | Yes | `DATABASE_URL`, `AUTH_SECRET` | Implemented; infrastructure not attached |
| Portfolio dashboard | Yes | Yes | Yes | PostgreSQL | Repository-backed with demo fallback |
| Properties/units | Yes | Yes | Yes | PostgreSQL | Read models + creation forms implemented |
| Tenants | Yes | Yes | Yes | PostgreSQL | Read models + creation form implemented |
| Lease creation/lifecycle | Yes | Yes | Yes | PostgreSQL, cron secret | 3/6 month rules + scheduled transitions implemented |
| Exact-term payment obligations | Yes | Yes | Yes | PostgreSQL | Implemented |
| Snippe payment initiation | Yes | Yes | Yes | Snippe credentials | Exact-obligation initiation implemented |
| Snippe webhook settlement | N/A | Yes | Yes | Snippe credentials | Signed, idempotent reconciliation implemented |
| Receipts/payment exceptions | Yes | Yes | Yes | PostgreSQL | Reconciliation path implemented |
| Listings/publication safety | Yes | Yes | Yes | PostgreSQL | Save/publish/pause; protected occupancy blocks publication |
| Supervisor assignments/invites | Yes | Yes | Yes | Messaging adapter for invite delivery | Service implemented; invite acceptance/delivery pending |
| Maintenance workflow | Yes | Yes | Yes | PostgreSQL | Creation, strict transitions, history and audit implemented |
| Safety notices | Yes | Yes | Yes | PostgreSQL | Create and acknowledge services implemented |
| Reports/audit read model | Yes | Partial | Yes | PostgreSQL | Core operational metrics implemented |
| Geography/import model | No | Schema | Yes | Import source | Schema implemented; importer/UI pending |
| Community | No | Schema | Yes | PostgreSQL | Schema only |
| Notifications | Partial | Partial | Yes | Delivery adapters | In-app lifecycle records implemented; external delivery pending |
| SMS/Briq OTP | No | Specified | No | Provider credentials | Pending integration |
| WhatsApp | No | Specified | No | Meta/provider credentials | Pending integration |
| Private document storage | No | Schema | Yes | Private object storage | Storage/upload/access controls pending |
| Lease document acknowledgement | No | Schema | Yes | Private object storage | Schema present; workflow pending |
| Listing images | No | Schema | Yes | Object storage | Schema present; upload/rendering pending |
| Health endpoint | Yes | N/A | N/A | None | Working |
| CI/build validation | N/A | N/A | N/A | GitHub/Vercel | Prisma generation enforced; schema and current application builds verified in previews |

## Infrastructure gate

The codebase is persistence-ready, but the deployed application is **not yet transactionally production-backed** because the Vercel project still has no `DATABASE_URL`. Production authentication also requires `AUTH_SECRET`; Snippe requires its API key, webhook secret and public callback URL.

Do not describe a capability as production-complete until the required infrastructure is attached, migrations are deployed, bootstrap data exists, and the relevant end-to-end path has been exercised against the production environment.
