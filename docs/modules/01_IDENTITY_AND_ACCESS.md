# Module 01 — Identity & Access

## Goal

Provide secure identity establishment and server-enforced authorization for every RentFlow role and resource.

## Users

- Platform administrator
- Landlord
- Property administrator
- Supervisor
- Tenant
- Invited/pending users

## Scope

- Registration and phone verification.
- Phone + 4-digit PIN sign-in.
- PIN setup, change and recovery.
- Signed credential-bound sessions.
- Invitation acceptance and organization joining.
- Role-aware navigation.
- Section permissions and resource authorization.
- Sign-in throttling and credential security.
- Account/profile identity UI.

## Primary routes

- `/register`
- `/register/verify`
- `/login`
- `/forgot-pin`
- `/invite/[token]`
- `/supervisors/accept`
- `/join/[code]`
- `/app/pin`
- `/app/account`

## Data requirements

- Normalized unique phone.
- Dedicated `pinHash` and `pinSetAt` fields.
- Role and organization membership.
- Session credential/version information.
- Invitation token lifecycle.
- Audit records for sensitive account events.

## Business rules

- PIN is exactly four digits but never stored directly.
- Authentication does not imply authorization.
- Every protected action resolves session + resource scope server-side.
- Supervisor and tenant permissions remain narrower than staff/admin permissions.
- Cross-organization access is denied even if route IDs are guessed.

## UI states

- registration entry and OTP verification;
- login;
- forgotten PIN;
- first-time PIN setup;
- invitation accepted/expired/invalid;
- pending organization state;
- account identity and security settings;
- invalid credentials and throttle feedback.

## Remaining implementation

1. Close Prisma identity schema gaps.
2. Persist PIN hash separately from legacy password compatibility field.
3. Verify registration/OTP in provider sandbox.
4. Add invitation token tests.
5. Add resource-level DB authorization tests.
6. Add Playwright journeys for every role.
7. Audit PIN reset/change and invitation acceptance.

## Test plan

- Phone normalization unit tests.
- Role permission matrix unit tests.
- Cross-org, cross-tenant and supervisor resource integration tests.
- Session invalidation tests after credential change.
- Throttling tests.
- Playwright login, logout, recovery, invitation and denied-route journeys.

## Exit criteria

- Every role can authenticate through its intended path.
- Unauthorized resource access is proven denied with DB-backed tests.
- PIN lifecycle is production-safe.
- No protected operation relies on UI hiding for authorization.
