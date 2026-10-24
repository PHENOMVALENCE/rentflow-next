# Module 00 — Foundation & Design System

## Goal

Provide the stable technical and visual base every other RentFlow module depends on.

## Scope

- Next.js App Router project structure.
- TypeScript, linting, Vitest and build gates.
- Prisma/PostgreSQL foundation and initial migration.
- Environment validation and demo-vs-persistent runtime behavior.
- Shared authenticated app shell and public shell.
- Shared design tokens, components and responsive conventions.
- Internationalization foundation.
- Common error/loading/empty-state patterns.
- CI and branch policy.

## Key implementation surfaces

- `src/app/*`
- `src/components/*`
- `src/styles/*`
- `src/i18n/*`
- `src/server/db*`
- `prisma/schema.prisma`
- `.github/workflows/ci.yml`

## Remaining work

1. Resolve schema gaps that block the initial migration.
2. Attach disposable development PostgreSQL.
3. Generate and review initial Prisma migration.
4. Seed a bootstrap platform administrator and representative organization data.
5. Add PostgreSQL service/test database to CI.
6. Complete remaining shared components: dialog, file preview, charts, property tile, household/person/SMS UI.
7. Continue eliminating compatibility-only styling as screens are ported.
8. Require loading, error and empty states for each new page.

## UI acceptance

- Authenticated shell behaves correctly on phone, tablet and desktop.
- Navigation reflects role and organization context.
- Shared components use current RentFlow tokens and do not introduce another visual language.
- Visible keyboard focus and touch-safe controls.
- English/Kiswahili switch remains available where applicable.

## Test plan

- CI: typecheck, lint, unit tests, production build.
- Translation coverage tests.
- Navigation tests.
- Database smoke migration + seed.
- Playwright shell/navigation smoke tests for each role.

## Exit criteria

- Fresh clone can install, migrate, seed, run and build using documented commands.
- CI includes PostgreSQL and is green.
- Shared UI primitives cover all common page patterns.
- Other modules can assume a real database and stable design system.
