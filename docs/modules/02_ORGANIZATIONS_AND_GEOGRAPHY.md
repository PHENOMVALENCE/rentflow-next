# Module 02 — Organizations & Geography

## Goal

Establish organization tenancy, branding, administrative context and normalized Tanzanian geographic reference data.

## Scope

- Organization creation/context.
- Landlord/property-admin membership.
- Organization branding and identity.
- Platform admin enter/exit organization context.
- Organization settings.
- Geography import and lookup.
- Region, district, ward, street and village normalization.

## Primary routes

- `/app/organization`
- `/app/settings`
- `/app/settings/geography`
- `/app/platform/organizations`
- `/app/platform/organizations/[id]`

## Data requirements

- Organization identity and configuration.
- Organization memberships.
- Branding metadata and private logo storage key.
- Normalized geographic entities and relations.
- Geography import batch/evidence records.
- Audit log for platform context entry/exit and configuration changes.

## Business rules

- Organization data is isolated by organization ID.
- Platform administrators may enter organization context only through audited server-side state.
- Branding is presentation-only and must not alter security/domain identity.
- Geographic references should use normalized relationships rather than repeated free text where parity requires it.

## UI states

- Organization profile and branding.
- Runtime configuration summary.
- Geography importer with success/failure evidence.
- Organization list/detail in platform console.
- Missing organization/pending account state.

## Remaining implementation

1. Complete normalized geography schema relationships.
2. Wire organization logo upload to private/object storage.
3. Validate geography import against representative source data.
4. Add organization isolation tests across all shared read models.
5. Finish translated organization/settings surfaces.
6. Add branding preview and robust upload error states.

## Test plan

- Cross-organization isolation integration tests.
- Platform context enter/exit authorization and audit tests.
- Geography import parser and persistence tests.
- Branding upload authorization tests.
- Playwright organization/settings journeys.

## Exit criteria

- Every organization-scoped record is isolated correctly.
- Platform context switching is audited and safe.
- Geographic references are reliable enough for property creation.
- Branding persists and renders without exposing private storage directly.
