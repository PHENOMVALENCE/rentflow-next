# Module 04 — Public Discovery & Inquiries

## Goal

Expose only genuinely available rental inventory to the public and capture inquiries without creating false reservations or leaking private data.

## Scope

- Public home/search.
- Listing filters and sort.
- Listing detail.
- Gallery/lightbox and quick view.
- Virtual tour when storage/schema supports it.
- Public inquiries.
- Staff inquiry pipeline and prospect creation.
- Public listing media delivery.

## Primary routes

- `/`
- `/listings/[id]`
- `/api/v1/listings/[listing]/inquiries`
- `/api/listing-images/[id]`
- `/app/inquiries`
- `/app/inquiries/[id]`

## Business rules

- Public eligibility is derived from authoritative unit/lease state plus listing publication configuration.
- Every public read/action re-checks eligibility.
- Inquiry submission never reserves a unit.
- Occupied/private tenant data never appears in public responses.
- Private media must be delivered through authorized/safe routes rather than raw storage URLs where required.

## UI states

- Search/filters/sorting.
- Empty search results.
- Property cards and quick view.
- Listing gallery/lightbox.
- Inquiry form success/validation states.
- Staff inquiry queue and detail.
- Qualified/prospect-created state.

## Remaining implementation

1. Add DB-backed listing eligibility tests.
2. Add per-field inquiry validation messages.
3. Wire inquiry outbound email once notification provider is selected.
4. Add virtual-tour schema/storage support if retained for parity.
5. Complete inquiry detail visual parity and translations.
6. Add API contract tests for public listing/inquiry endpoints.

## Test plan

- Occupied/protected unit never appears publicly.
- Unpublished/disabled listing never appears.
- Eligibility is rechecked on inquiry submission.
- Public payload contains no tenant/private fields.
- Inquiry creates scoped record only.
- Playwright public search → detail → inquiry journey.

## Exit criteria

- Public discovery is safe under real PostgreSQL state.
- Public and staff inquiry flows work end to end.
- Listing media is reliable and access-safe.
