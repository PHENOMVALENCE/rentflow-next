# Module 08 — Documents & Private Storage

## Goal

Provide secure storage, authorization and access evidence for agreements, lease files, organization branding and operational documents.

## Scope

- Lease agreements.
- Standard lease templates.
- Operational document library.
- Attachment/document uploads.
- Organization logo and protected media.
- Download/open routes.
- Tenant acknowledgement/view evidence.
- Private object storage adapter.

## Primary routes

- `/app/agreements`
- `/app/standard-leases`
- `/app/operational-documents`
- `/api/documents/[id]/download`
- `/api/lease-templates/[id]/download`
- organization/listing media routes where applicable

## Core rules

- Private files are never exposed through guessable public storage URLs.
- Access is checked server-side for each open/download request.
- Tenant can access only documents linked to their authorized lease/account.
- Staff access is organization/resource-scoped.
- Acknowledgement records a view/acknowledgement event; it is not represented as a certified e-signature unless a future product decision explicitly adds one.
- Storage failures must not fabricate success URLs.

## Data requirements

- Document metadata.
- Storage key/provider metadata.
- Lease-document relation and kind.
- Required flag.
- Acknowledgement/access evidence.
- Template metadata/version.
- Audit events.

## UI states

- Tenant agreement list grouped by lease.
- Document row with type, requirement and view state.
- Standard template library.
- Staff operational document library.
- File preview/dialog where supported.
- Upload progress/error/invalid-file states.

## Remaining implementation

1. Select/configure production private object store.
2. Implement upload/get/delete adapter behind current storage contract.
3. Add document access integration tests.
4. Finish dialog/file-preview shared components.
5. Validate content type, size and file-name handling.
6. Wire organization logos/listing private media to the same storage policy where appropriate.
7. Define retention/deletion behavior.

## Test plan

- Cross-tenant document denial.
- Cross-organization denial.
- Supervisor access only where policy permits.
- Missing/unconfigured store fails safely.
- Upload validation.
- Authorized download/acknowledgement audit.
- Playwright tenant agreement open/acknowledge journey.

## Exit criteria

- Private files can be uploaded and accessed only through authorized application paths.
- Storage provider has been exercised from deployed preview.
- Critical document-access parity gate has automated evidence.
