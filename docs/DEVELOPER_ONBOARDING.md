# Developer Onboarding

## Start here

Read `AGENTS.md`, `PROJECT.md` and `docs/README.md` in that order.

## Local setup

```bash
git clone https://github.com/PHENOMVALENCE/rentflow-next.git
cd rentflow-next
npm install
cp .env.example .env.local
npm run dev
```

Without a database connection the public/admin demonstration surfaces remain usable because the current delivery slice uses synthetic data. Database-backed work must not silently fall back to fake provider results.

## Code map

- `src/app` — routes and composition
- `src/components` — shared UI
- `src/domain` — framework-independent business rules
- `src/lib/demo-data.ts` — temporary synthetic delivery data
- `prisma/schema.prisma` — target persistent model
- `docs/PARITY_MATRIX.md` — migration tracker

## Before changing critical behavior

Check the Laravel reference and update an ADR/decision if behavior intentionally changes.

## Quality commands

```bash
npm run typecheck
npm test
npm run build
```

GitHub Actions runs these on pushes and pull requests.