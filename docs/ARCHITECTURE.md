# RentFlow Next Architecture

## Architectural style

RentFlow Next is a modular Next.js application with explicit separation between UI, application services, domain rules, persistence and external integrations.

```text
Browser
  -> Next.js App Router
      -> Server Components / Server Actions / Route Handlers
          -> Application services
              -> Domain rules
              -> Repositories
                  -> PostgreSQL / Prisma
              -> Integration ports
                  -> Snippe
                  -> OTP/SMS provider
                  -> File storage
                  -> Notification provider
```

## Boundaries

### `src/app`
Routing and composition only. Pages should not contain payment reconciliation, lease-transition or authorization rules.

### `src/features`
Feature-level UI, actions and queries. Examples: properties, leases, payments, maintenance and listings.

### `src/domain`
Pure TypeScript domain logic. Lease lifecycle, availability, payment matching, supervisor resolution and other critical state rules belong here and should be independently testable.

### `src/server`
Server-only implementation: database client, repositories, authentication, authorization, application services, storage and provider adapters.

## Core domain modules

- Identity & Access
- Organizations & Geography
- Properties & Units
- Public Listings
- Tenants & Tenancies
- Lease Terms & Renewals
- Lease Documents
- Payment Obligations & Payments
- Supervisor Assignments
- Maintenance
- Community & Notices
- Notifications
- Audit
- Reporting

## Key invariants to preserve from Laravel

- One authoritative occupancy/lease state per unit.
- Initial lease terms are 3 or 6 months.
- Full-term payment is required for activation/renewal.
- Partial or mismatched payments never activate a lease.
- Provider/server reconciliation is authoritative.
- Renewal opens 14 days before term end.
- Grace baseline is 7 days after expiry when renewal remains incomplete.
- Public listing eligibility derives from authoritative occupancy/lease state plus listing configuration.
- Supervisor access is scoped by assignment and organization.
- Sensitive tenant data is server-authorized and never exposed through public routes.

## Authentication and authorization

Authentication establishes identity; authorization remains explicit. Protected server actions and route handlers must resolve the session and enforce role/resource policy before accessing or mutating protected data.

Roles initially map to:

- LANDLORD / PROPERTY_ADMIN
- TENANT
- SUPERVISOR
- PLATFORM_ADMIN

Do not rely on hidden UI elements as authorization.

## Persistence

PostgreSQL is the target database. Prisma provides schema/migrations and typed persistence. Monetary values use integer minor units or a fixed decimal representation; never JavaScript floating-point arithmetic for authoritative money calculations.

Transactions are required for state transitions where multiple records must remain consistent, especially payment reconciliation and lease activation/renewal.

## Scheduled work

Lease/renewal discovery, notification scheduling and similar work must be idempotent. Vercel Cron may trigger protected route handlers, but the domain service owns transitions and must be safe to retry.

## Integrations

Provider code is implemented behind ports/adapters. Core services depend on contracts, not SDK-specific response objects.

Payment flow:

1. Resolve exact obligation.
2. Create internal payment attempt/reference.
3. Initiate through payment adapter.
4. Persist provider reference.
5. Receive trusted server-side result/webhook.
6. Verify provider identity/signature where available.
7. Validate reference, currency and exact amount.
8. Reconcile idempotently in a database transaction.
9. Activate/renew exactly once.
10. Emit audit and notification events.

## UI architecture

Use responsive, mobile-first layouts. Server Components are default for data-heavy pages. Client Components are reserved for interactive state that genuinely requires the browser.

The existing Laravel UI is a parity reference, but componentization should be improved rather than mechanically translating Blade/Livewire structure.

## Testing gates

Critical domain rules require unit tests. Repository/application boundaries require integration tests. Role-specific core journeys require Playwright coverage.

Minimum high-risk journeys:

- public listing eligibility
- unauthorized cross-tenant access denial
- tenant lease/countdown view
- exact payment initiation
- duplicate payment callback idempotency
- mismatched/partial payment rejection
- renewal/grace/expiry transition
- maintenance assignment
- supervisor scope enforcement
