# Feature Delivery Record

This file distinguishes **implemented in code**, **demoable without infrastructure**, and **production-backed** capabilities. A feature is not production-complete merely because its code path exists.

| Capability | UI/read path | Domain/write path | Persistence-ready | External dependency | Current status |
|---|---:|---:|---:|---|---|
| Public home/listings/detail | Yes | Yes | Yes | Private media storage for images | Occupancy-safe repository reads + gallery rendering; demo fallback when DB absent |
| Public property inquiries | Yes | Yes | Yes | None | Public intake + operator qualification/prospect conversion implemented |
| Application shell | Yes | N/A | Yes | None | Role-aware; authenticated when DB enabled |
| Authentication/RBAC | Yes | Yes | Yes | `DATABASE_URL`, `AUTH_SECRET` | Phone + 4-digit PIN sign-in, server RBAC, credential-bound session invalidation, throttling and scoped office reset implemented; dedicated Prisma PIN columns still pending migration |
| Forgot PIN / identity OTP | Yes | Yes | Yes | Briq credentials | Signed short-lived recovery state + Briq request/resend/verify implemented; not production-enabled without credentials |
| Account PIN management | Yes | Yes | Yes | PostgreSQL | Self-service change PIN and tenant/supervisor office reset implemented with audit evidence |
| Portfolio dashboard | Yes | Yes | Yes | PostgreSQL | Portfolio, supervisor and tenant-specific read models implemented |
| Platform operations console | Yes | Partial | Yes | PostgreSQL | Organizations/users/search/activity/payments/reconciliation/health/integrations/security/integrity/analytics plus OPEN→ACKNOWLEDGED→RESOLVED incident actions implemented |
| Properties/units | Yes | Yes | Yes | PostgreSQL | Read models + scoped creation forms implemented |
| Tenants | Yes | Yes | Yes | PostgreSQL | Scoped read/detail models, profile editing, minimized identity fields and attachment-request workflow implemented |
| Lease creation/lifecycle | Yes | Yes | Yes | PostgreSQL, cron secret | 3/6 month rules + scheduled T-14/grace/expiry transitions implemented |
| Exact-term payment obligations | Yes | Yes | Yes | PostgreSQL | Implemented |
| Snippe payment initiation | Yes | Yes | Yes | Snippe credentials | Exact-obligation initiation implemented |
| Snippe webhook settlement | N/A | Yes | Yes | Snippe credentials | Signed/fresh/idempotent reconciliation implemented; application no longer persists webhook payload fragments |
| Receipts/payment exceptions | Yes | Yes | Yes | PostgreSQL | Receipt + exception reconciliation implemented |
| Listings/publication safety | Yes | Yes | Yes | PostgreSQL | Save/publish/pause; public reads and image access independently re-check protected occupancy |
| Listing images | Yes | Yes | Yes | Private object storage | Upload/remove/gallery/public eligibility route implemented. Local storage is development-only; production remote adapter pending |
| Supervisor assignments/invites | Yes | Yes | Yes | Optional delivery adapter | Invite creation/acceptance, assignment/unassignment and supervisor office PIN reset UI implemented; invite link delivery remains provider-dependent |
| Maintenance workflow | Yes | Yes | Yes | PostgreSQL | Creation, strict transitions, actor-scoped history and audit implemented |
| Safety notices | Yes | Yes | Yes | PostgreSQL | Publish, actor-scoped detail, acknowledgement evidence and audit implemented |
| Community | Yes | Yes | Yes | PostgreSQL | Property eligibility, membership, posting, reporting and moderation implemented |
| Inquiry/prospect pipeline | Yes | Yes | Yes | PostgreSQL | Queue, status workflow, qualification and prospect conversion implemented |
| Reports/audit | Yes | Yes | Yes | PostgreSQL | Operational metrics + chronological audit viewer implemented |
| Geography/import | Yes | Yes | Yes | CSV reference source | Platform-admin bounded CSV import with per-row success/failure evidence implemented; schema normalization follow-up remains |
| Notifications | Partial | Partial | Yes | Delivery adapters | In-app lifecycle records implemented; production external delivery orchestration remains incomplete |
| Briq identity OTP | Yes | Yes | Yes | `BRIQ_API_KEY` | Adapter + Forgot PIN flow implemented; production credentials pending |
| Notification SMS | Adapter | Adapter | N/A | Production provider decision | SMSGate adapter exists for local/test only with recipient allowlist. Production notification-SMS provider remains intentionally undecided |
| Briq WhatsApp | Adapter | Adapter | N/A | Briq credentials + approved templates | Template adapter implemented but feature should remain disabled until approved templates/configuration exist |
| Private document storage | Yes | Yes | Yes | Private object storage | Authorized lease-document access and local development object store implemented; production remote adapter pending |
| Lease document acknowledgement | Yes | Yes | Yes | PostgreSQL/storage | Acknowledgement/access workflow implemented; actual document retrieval requires configured private storage |
| Production bootstrap | N/A | Yes | Yes | PostgreSQL | Environment-driven organization/admin seed now uses normalized phone + 4-digit PIN |
| Prisma migrations | N/A | N/A | Schema exists | Database/local Prisma environment | Initial migration and schema parity migrations still pending generation/deploy; see `SCHEMA_PARITY_GAPS.md` |
| Health endpoint | Yes | N/A | N/A | None | Working |
| CI/build validation | N/A | N/A | N/A | GitHub/Vercel | Quality workflow exists. Current branch Vercel validation is infrastructure-blocked by build-rate limiting; do not interpret that as a successful or failed compile |

## Infrastructure gate

The implementation is substantially persistence-aware, but the deployed application is **not yet transactionally production-backed** because the Vercel project still has no confirmed `DATABASE_URL`. Production authentication requires `AUTH_SECRET`; Briq OTP requires provider credentials; Snippe requires its API key, webhook secret and callback URL; production documents and listing media require a remote private object-store adapter.

The initial Prisma migration has not been committed or deployed. The current schema also has known compatibility gaps around dedicated PIN fields, phone uniqueness, incident states, SMS privacy, geography relations and legacy payment payload storage. See `SCHEMA_PARITY_GAPS.md`.

Do not describe a capability as production-complete until its required infrastructure is attached, generated migrations are reviewed/deployed, bootstrap data exists, and the relevant end-to-end path has been exercised against the intended production environment.
