# Contributing to RentFlow Next

RentFlow Next rebuilds the existing Laravel RentFlow product in Next.js while preserving its business semantics.

## Setup

See `docs/DEVELOPER_ONBOARDING.md`. In short:

```bash
git clone https://github.com/PHENOMVALENCE/rentflow-next.git
cd rentflow-next
git checkout codex/masterchanges
npm install --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

## Required tools

- Node.js 22+
- npm
- PostgreSQL for persistent development
- Git/GitHub

## Branch policy

- `main` is the release branch; merging to it does not deploy (ADR-N007).
- All implementation work is committed to `codex/masterchanges`, the only branch that opens PRs to `main`. Do not create other branches. See `docs/BRANCH_POLICY.md`.
- Do not combine unrelated schema, UI and provider changes in one commit.
- Never commit credentials, private tenant data, payment secrets or agreement documents.

## Commits

Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`, `build:`, `ci:`.

## Pull requests

PRs should state: requirement addressed, domain/state impact, schema/config impact, authorization/privacy impact, validation/tests performed, parity row and roadmap updated, and known limitations.

## UI contributions

Follow the Laravel baseline (ADR-N006, `docs/DESIGN_SYSTEM.md`): reuse `src/components` and Laravel class names instead of new ad-hoc styles. Material UI changes must include mobile/desktop behavior, loading/empty/error states, keyboard focus, accessible labels and status meaning that does not depend on colour alone.

## Testing

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

High-risk changes require coverage for availability, authorization, lease lifecycle, payment matching/idempotency, document privacy, supervisor scope and scheduler retry safety.