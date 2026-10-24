# Module 11 — Communications & Notifications

## Goal

Deliver scoped operational communication through notices, communities and notification channels without coupling provider details to domain logic.

## Scope

- Organization/property notices.
- Safety notices.
- Community membership and messaging.
- In-app notifications.
- Lease reminders.
- Inquiry email.
- Platform alert email.
- Tenant SMS.
- WhatsApp delivery/history if enabled.
- Provider adapters and templates.

## Primary routes

- `/app/notices`
- `/app/notices/[id]`
- `/app/community`
- `/app/community/[id]`
- `/app/notifications`
- account WhatsApp history route when implemented

## Business rules

- Notice/community visibility respects organization/property scope.
- Notification intent is created from domain events; providers are adapters.
- Delivery failure never rewrites authoritative lease/payment state.
- Dedupe keys prevent repeated scheduled reminders.
- Sensitive information is minimized by channel.
- WhatsApp templates/provider requirements remain external integration concerns.

## Data requirements

- Notice and audience scope.
- Community/membership/messages.
- In-app notification records.
- Notification intent/outbox where required.
- Provider message ID/status/error.
- Dedupe key/template/channel metadata.

## UI states

- Notices list/detail.
- Community list/detail.
- Notification center/bell.
- Delivery status/history for permitted staff/platform users.
- Empty and provider-failure states.

## Remaining implementation

1. Decide/configure production SMS provider.
2. Wire existing adapters into inquiry, lease reminder and operational workflows.
3. Implement outbound email jobs/adapter if missing.
4. Implement WhatsApp provider/templates/history if retained for parity.
5. Add durable outbox/retry design if direct provider calls are insufficient.
6. Complete notification bell parity.
7. Add delivery failure observability.

## Test plan

- audience/scope integration tests;
- reminder dedupe tests;
- provider adapter contract tests;
- retries do not duplicate domain effects;
- failed provider delivery preserves core business state;
- Playwright notice/community/notification role journeys.

## Exit criteria

- In-app communication is DB-backed and scoped.
- Each enabled external channel has sandbox/provider evidence.
- Delivery failures are visible and retry-safe.
