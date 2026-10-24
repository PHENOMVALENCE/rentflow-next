# Module 14 — Integrations & Operations

## Goal

Make RentFlow deployable, observable, recoverable and safe around every external dependency.

## Scope

- PostgreSQL production configuration.
- Snippe payment provider.
- Briq OTP.
- SMS provider.
- Email provider.
- WhatsApp provider if enabled.
- Private object storage.
- Vercel deployment and cron.
- Health/readiness endpoints.
- Error reporting and alerts.
- Backups, verification and restore.
- Environment/secrets management.

## Required runtime configuration

At minimum:

- `DATABASE_URL`
- `AUTH_SECRET`
- `CRON_SECRET`
- payment provider credentials/webhook secret/URL
- OTP credentials
- notification provider credentials as enabled
- private storage credentials/configuration

## Operational rules

- Secrets never enter client bundles or repository history.
- Readiness differs from liveness: app process health does not imply dependencies are usable.
- Provider failures are logged without leaking credentials or sensitive payloads.
- Webhooks and cron handlers are authenticated/verified.
- Retriable operations are idempotent.
- Production backups have a tested restore path.

## Health surfaces

- `/api/health`
- `/api/health/readiness`
- platform health/integrations/jobs views

## Remaining implementation

1. Provision production/development PostgreSQL environments.
2. Configure private storage.
3. Exercise Snippe sandbox from deployed preview.
4. Exercise Briq OTP from deployed preview.
5. Finalize SMS/email/WhatsApp providers and templates.
6. Configure Vercel Cron and protected endpoints.
7. Add error monitoring and payment/scheduler alerts.
8. Configure database/provider backups and run restore drill.
9. Define production log retention and incident response.
10. Re-enable/define automated deployment policy when release process is ready.

## Test plan

- readiness returns failure when critical dependency is unavailable;
- webhook signature/authentication tests;
- cron secret tests;
- provider sandbox smoke tests;
- object-store upload/download/delete smoke tests;
- backup creation + restore drill;
- alert generated for intentional payment/scheduler failure in non-production environment.

## Exit criteria

- Every external provider has recorded preview/sandbox evidence.
- Production health, logs and alerts make failures diagnosable.
- Backup/restore is proven, not only configured.
- Deployment checklist can be executed repeatably.
