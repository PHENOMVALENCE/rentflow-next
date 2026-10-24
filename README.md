# RentFlow Next

Next.js reimplementation of the existing RentFlow Laravel application.

## Migration objective

Rebuild RentFlow in Next.js while preserving the current product behavior, domain rules, roles, workflows and user-facing capabilities. The Laravel repository (`PHENOMVALENCE/RentFlow`) remains the behavioral reference during migration.

This is a parity migration, not a product rewrite. Architectural changes must not silently change lease, payment, availability, authorization, maintenance or supervisor-assignment rules.

## Target stack

- Next.js (App Router)
- TypeScript
- React Server Components by default
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Zod validation
- Phone + 4-digit PIN authentication with signed, credential-bound session cookies
- Vitest for unit/domain tests
- Playwright for end-to-end tests
- Vercel deployment target

Provider-specific integrations are isolated behind adapters so Snippe, Briq/SMS and future providers do not leak into the core domain.

## Core product surfaces

- Public property/unit discovery
- Landlord / property administrator workspace
- Tenant workspace
- Supervisor workspace
- Platform administration
- Lease lifecycle and renewal/grace processing
- Full-term payment obligations and reconciliation
- Agreement/document access
- Maintenance workflow
- Notices/community communication
- Notifications and audit history
- Operational reporting

## Repository structure

```text
src/
  app/             # routes, layouts, route handlers (pages compose; no business rules)
  components/      # shared UI: ui.tsx, icons.tsx, app-shell.tsx, pub/* (public + auth)
  domain/          # framework-independent business rules + unit tests
  server/
    auth/          # session, sign-in, PIN, invitations, authorization
    rentflow/      # feature read models (*-read-model.ts) and server actions (*-actions.ts)
    payments/      # Snippe adapter and reconciliation
    integrations/  # Briq OTP/WhatsApp, SMSGate
    storage/       # private object store contract
    api/           # /api/v1 helpers
  lib/             # shared utilities (demo data, listing filters, navigation)
  styles/          # baseline stylesheets ported from Laravel
prisma/            # schema and seed (no migrations generated yet)
public/            # favicon, hero images
docs/              # roadmap, parity, architecture and implementation docs
```

Tests sit next to the code they cover (`*.test.ts`).

## Migration rules

1. Laravel behavior is the reference until a documented Next.js decision supersedes it.
2. Preserve authoritative domain state; do not replace it with UI-only flags.
3. Payment callbacks/server reconciliation are authoritative; browser success is not.
4. Public listings must never expose occupied/private tenant data.
5. Authorization is enforced server-side for every protected operation.
6. Every migrated capability is recorded in `docs/PARITY_MATRIX.md`.
7. New behavior requires an ADR or explicit product decision.
8. Secrets must never be committed.

## Status and roadmap

Current state, milestones and known gaps: **`docs/ROADMAP.md`**. Per-capability evidence: `docs/PARITY_MATRIX.md`. Method and phase definitions: `docs/MIGRATION_PLAN.md`.

## Local development

```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # leave DATABASE_URL empty for demo mode
npm run dev
```

Quality gate: `npm run typecheck && npm run lint && npm test && npm run build`.
