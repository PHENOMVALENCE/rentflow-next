# Contributing to RentFlow Next

RentFlow Next rebuilds the existing Laravel RentFlow product in Next.js while preserving its business semantics.

## Setup

```bash
git clone https://github.com/PHENOMVALENCE/rentflow-next.git
cd rentflow-next
npm install
cp .env.example .env.local
npm run dev
```

## Required tools

- Node.js 22+
- npm
- PostgreSQL for persistent development
- Git/GitHub

## Branch policy

- `main` is deployable.
- Feature work should use focused branches and PRs where practical.
- Do not combine unrelated schema, UI and provider changes.
- Never commit credentials, private tenant data, payment secrets or agreement documents.

## Commits

Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`, `build:`, `ci:`.

## Pull requests

PRs should state: requirement addressed, domain/state impact, schema/config impact, authorization/privacy impact, validation/tests performed, parity row updated and known limitations.

## UI contributions

Use the RentFlow design tokens and role-specific shells. Material UI changes must include mobile/desktop behavior, loading/empty/error states, keyboard focus, accessible labels and status meaning that does not depend on colour alone.

## Testing

Run:

```bash
npm run typecheck
npm test
npm run build
```

High-risk changes require coverage for availability, authorization, lease lifecycle, payment matching/idempotency, document privacy, supervisor scope and scheduler retry safety.