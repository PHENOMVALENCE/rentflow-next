# Branch Policy

RentFlow Next uses a protected implementation workflow centered on `codex/masterchanges`.

## Branches

- `main` is the release branch.
- `codex/masterchanges` is the implementation branch for active development.
- Implementation work must not be committed directly to `main`.
- Do not create other branches (`feat/*`, `fix/*`, …); `codex/masterchanges` is the only branch that opens PRs to `main`.
- Merging does not deploy; see `DEPLOYMENT.md`.

## Commit policy

Use small, focused conventional commits:

- `feat:` new product capability
- `fix:` bug fix
- `docs:` documentation
- `test:` automated tests
- `refactor:` behavior-preserving restructuring
- `ci:` automation and workflow changes
- `chore:` maintenance/tooling

## Pull request flow

1. Start from the latest `main`.
2. Implement only on `codex/masterchanges`.
3. Keep commits small and reviewable.
4. Run typecheck, lint, tests and production build.
5. Open a PR from `codex/masterchanges` to `main` when a milestone gate in `ROADMAP.md` is met (or a fix must ship).
6. The repository auto-merge workflow synchronizes `main` into the implementation branch, resolves textual conflicts by preferring the implementation branch, validates the application, then merges the PR.

## Conflict policy

For the automated PR workflow, the implementation branch is authoritative for conflicted paths. When `main` is merged into `codex/masterchanges`, the workflow preserves the `codex/masterchanges` version of conflicting files.

This is intentionally aggressive automation, and it means a merged PR can silently discard `main`-side edits. Changes to security configuration, database migrations, payment logic, authentication/authorization or production infrastructure should still be reviewed before opening the final PR.
