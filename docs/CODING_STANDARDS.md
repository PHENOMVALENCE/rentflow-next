# Coding Standards

## TypeScript

Strict TypeScript. Avoid `any`; narrow external data with Zod. Prefer named domain types/enums. Keep money/date conversion explicit.

## Next.js

Server Components by default. Use Route Handlers for provider/webhook/API boundaries. Use Server Actions only for trusted app mutations and always authorize again on the server.

## Architecture

- `src/app`: route composition
- `src/components`: reusable presentation
- `src/features`: feature UI/actions
- `src/domain`: pure business logic
- `src/server`: DB/auth/services/adapters
- `src/lib`: generic utilities

Pages do not contain critical transition logic.

## Data

Use Prisma migrations. Never access database from Client Components. Transactions wrap multi-record state changes.

## Error handling

Expected domain failures return typed results; unexpected faults are logged with safe context. Do not log secrets, full provider payloads, agreement files or private household data.