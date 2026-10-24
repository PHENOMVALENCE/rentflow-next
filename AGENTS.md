# RentFlow Next — Agent Rules

RentFlow Next is a parity migration of `PHENOMVALENCE/RentFlow` from Laravel to Next.js. Human contributors and coding agents must preserve product rules unless a documented decision explicitly changes them.

## Read order

1. `PROJECT.md`
2. `docs/README.md`
3. `docs/PRODUCT_REQUIREMENTS.md`
4. `docs/SRS.md`
5. `docs/DOMAIN_MODEL.md`
6. `docs/ARCHITECTURE.md`
7. `docs/DATABASE_SCHEMA.md`
8. `docs/DESIGN_SYSTEM.md`
9. `docs/UI_UX_DESIGN.md`
10. `docs/SECURITY.md`
11. `docs/TESTING.md`
12. `docs/PARITY_MATRIX.md`

## Non-negotiable invariants

- Availability is derived from lease/occupancy state plus listing configuration.
- A unit protected by active/reserved/renewal/grace occupancy cannot be publicly listed.
- Initial lease terms are 3 or 6 months.
- One exact full-term payment obligation exists per lease term in MVP.
- Partial/mismatched payments never activate or renew a lease.
- Browser success is never authoritative payment confirmation.
- Provider reconciliation is server-side and idempotent.
- Private tenant, agreement, household and operational data never leaks to public routes.
- Supervisor access is assignment-scoped and organization-scoped.
- Audit history is append-oriented and excludes secrets/provider payloads.

## Engineering rules

- App Router and strict TypeScript.
- Server Components by default; Client Components only for browser interaction.
- Domain rules belong in `src/domain`; pages must not invent state transitions.
- Persistence is behind `src/server` repositories.
- Integrations depend on ports/adapters.
- Money uses integer minor units or database Decimal; never authoritative floating point.
- Every protected action re-checks authorization server-side.
- Critical state transitions require tests.
- Update `docs/PARITY_MATRIX.md` as Laravel behavior is migrated.

## Delivery discipline

Prefer small conventional commits. A feature is not complete until UI, domain rules, authorization, tests and relevant docs are updated.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
