# Testing Strategy

## Layers

1. Domain unit tests with Vitest.
2. Application/repository integration tests.
3. Route/webhook contract tests.
4. Playwright role journeys.

## Mandatory high-risk coverage

- public availability eligibility
- cross-tenant access denial
- 3/6 month term validation
- T-14 / end / T+7 transitions
- exact payment matching
- duplicate callback idempotency
- partial/mismatched payment exception
- private agreement authorization
- supervisor property scope
- maintenance transitions
- scheduler catch-up/retry safety

## Release gate

`npm run typecheck && npm test && npm run build` must pass before release.