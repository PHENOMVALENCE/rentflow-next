# Database Schema — Next.js/PostgreSQL

The Next.js target maps the Laravel canonical model into Prisma/PostgreSQL without changing semantics.

## Canonical tables/models

`User`, `Organization`, `OrganizationMember`, `Region`, `District`, `Ward`, `StreetVillage`, `Property`, `Building`, `Unit`, `Tenant`, `TenantProfile`, `PropertyInquiry`, `Lease`, `PaymentObligation`, `PaymentProvider`, `PaymentTransaction`, `Receipt`, `SupervisorAssignment`, `MaintenanceRequest`, `MaintenanceUpdate`, `Document`, `LeaseDocument`, `DocumentAcknowledgement`, `Notification`, `Community`, `CommunityMember`, `CommunityMessage`, `SafetyNotice`, `PropertyListing`, `ListingImage`, `AuditLog`, `ShortLink`.

## Rules

- Historical lease/payment/document/maintenance/audit records are preserved.
- Occupancy is lease state, not `Unit.status`.
- One exact `PaymentObligation` per lease.
- Decimal/integer-safe money; never float.
- Provider reference and RentFlow internal reference remain separate.
- Public listing tables contain no private tenant data.
- Append-oriented audit data.

The executable schema is `prisma/schema.prisma`. Any schema change requires a migration and parity review against the Laravel database model.