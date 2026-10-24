# Coding Standards

## TypeScript

Strict TypeScript. Avoid `any`; narrow external data with Zod. Prefer named domain types/enums. Keep money/date conversion explicit.

## Next.js

Server Components by default. Use Route Handlers for provider/webhook/API boundaries. Use Server Actions only for trusted app mutations and always authorize again on the server.

## Architecture

- `src/app`: route composition
- `src/components`: reusable presentation (Laravel class names)
- `src/domain`: pure business logic
- `src/server/rentflow`: feature read models and server actions
- `src/server/{auth,payments,integrations,storage}`: identity, payments, adapters
- `src/lib`: generic utilities

A `"use server"` module may export only async functions. Put constants, schemas and helpers in a sibling module (for example `pin-constants.ts`, `tenant-onboarding-notes.ts`) or the production build fails.

Pages do not contain critical transition logic.

## Data

Use Prisma migrations. Never access database from Client Components. Transactions wrap multi-record state changes.

## Error handling

Expected domain failures return typed results; unexpected faults are logged with safe context. Do not log secrets, full provider payloads, agreement files or private household data.