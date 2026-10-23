# Feature Delivery Record

This file distinguishes **implemented in code**, **demoable without infrastructure**, and **production-backed** capabilities. A feature is not production-complete merely because its code path exists.

| Capability | UI/read path | Domain/write path | Persistence-ready | External dependency | Current status |
|---|---:|---:|---:|---|---|
| Public home/listings/detail | Yes | Yes | Yes | None | Repository-backed with demo fallback |
| Public property inquiries | Yes | Yes | Yes | None | Public intake + operator qualification/prospect conversion implemented |
| Application shell | Yes | N/A | Yes | None | Role-aware; authenticated when DB enabled |
| Authentication/RBAC | Yes | Yes | Yes | `DATABASE_URL`, `AUTH_SECRET` | Route, query and mutation scopes implemented |
| Portfolio dashboard | Yes | Yes | Yes | PostgreSQL | Portfolio, supervisor and tenant-specific read models implemented |
| Properties/units | Yes | Yes | Yes | PostgreSQL | Read models + scoped creation forms implemented |
| Tenants | Yes | Yes | Yes | PostgreSQL | Scoped read models + creation form implemented |
| Lease creation/lifecycle | Yes | Yes | Yes | PostgreSQL, cron secret | 3/6 month rules + scheduled T-14/grace/expiry transitions implemented |
| Exact-term payment obligations | Yes | Yes | Yes | PostgreSQL | Implemented |
| Snippe payment initiation | Yes | Yes | Yes | Snippe credentials | Exact-obligation initiation implemented |
| Snippe webhook settlement | N/A | Yes | Yes | Snippe credentials | Signed, fresh, idempotent reconciliation implemented |
| Receipts/payment exceptions | Yes | Yes | Yes | PostgreSQL | Receipt + exception reconciliation implemented |
| Listings/publication safety | Yes | Yes | Yes | PostgreSQL | Save/publish/pause; protected occupancy blocks publication |
| Supervisor assignments/invites | Yes | Yes | Yes | Optional delivery adapter | Invite creation/acceptance + assignment/unassignment UI implemented; invite link currently shared manually |
| Maintenance workflow | Yes | Yes | Yes | PostgreSQL | Creation, strict transitions, actor-scoped history and audit implemented |
| Safety notices | Yes | Yes | Yes | PostgreSQL | Publish, actor-scoped detail, acknowledgement evidence and audit implemented |
| Community | Yes | Yes | Yes | PostgreSQL | Property eligibility, membership, posting, reporting and moderation implemented |
| Inquiry/prospect pipeline | Yes | Yes | Yes | PostgreSQL | Queue, status workflow, qualification and prospect conversion implemented |
| Reports/audit | Yes | Yes | Yes | PostgreSQL | Operational metrics + chronological audit viewer implemented |
| Geography/import | Yes | Yes | Yes | CSV reference source | Platform-admin bounded CSV import with per-row success/failure evidence implemented |
| Notifications | Partial | Partial | Yes | Delivery adapters | In-app lifecycle records implemented; external delivery pending |
| SMS/Briq OTP | No | Specified | No | Provider credentials | Pending provider integration |
| WhatsApp | No | Specified | No | Meta/provider credentials | Pending provider integration |
| Private document storage | No | Schema | Yes | Private object storage | Storage adapter/upload/access workflow pending |
| Lease document acknowledgement | No | Schema | Yes | Private object storage | Schema present; workflow pending |
| Listing images | No | Schema | Yes | Object storage | Schema present; upload/rendering pending |
| Tenant profile/attachment requests | Partial | Schema | Yes | PostgreSQL/storage | Profile schema exists; management workflow pending |
| Production bootstrap | N/A | Yes | Yes | PostgreSQL | Idempotent environment-driven organization/admin seed implemented |
| Prisma migrations | N/A | N/A | Schema validated | Database/local Prisma environment | Initial migration file still pending generation/deploy |
| Health endpoint | Yes | N/A | N/A | None | Working |
| CI/build validation | N/A | N/A | N/A | GitHub/Vercel | Prisma generation enforced; validated schema and implementation previews verified incrementally |

## Infrastructure gate

The codebase is persistence-ready, but the deployed application is **not yet transactionally production-backed** because the Vercel project still has no `DATABASE_URL`. Production authentication also requires `AUTH_SECRET`; Snippe requires its API key, webhook secret and public callback URL. Private documents and listing media additionally require a private object-storage provider.

The initial Prisma migration has not been committed yet. The current execution environment could not install/execute Prisma tooling against a local checkout, so the validated `prisma/schema.prisma` remains authoritative until the migration is generated in a connected development/database environment. Do not substitute a hand-written schema migration.

Do not describe a capability as production-complete until its required infrastructure is attached, migrations are deployed, bootstrap data exists, and the relevant end-to-end path has been exercised against the production environment.
