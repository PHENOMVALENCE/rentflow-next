# Changelog

All notable RentFlow Next changes are recorded here.

## 2026-10-24

### Changed
- Adopted the Laravel RentFlow visual baseline: IBM Plex, blue/teal brand, gradient house mark, favicon and hero photography.
- Public home now matches the Laravel discovery page (hero search, filters, sort, listing cards, how-it-works, landlord CTA, footer); `/listings` redirects to it.
- Listing detail page ported with the inline enquiry form; `/listings/[id]/inquire` redirects to it.
- Authenticated shell rebuilt: collapsible sidebar with Laravel role navigation, top bar, account menu and mobile drawer.
- Dashboard rebuilt with metrics, needs-attention, maintenance, payments and renewals panels.
- Sign-in, registration, PIN recovery and invitation flows moved to the baseline guest layout.

### Added
- `docs/ROADMAP.md`: current state, milestones M1–M6 with exit gates, and Laravel gap list (G1–G11).
- `/app/community` index so the sidebar Community link no longer 404s.

### Documentation
- Parity matrix rebuilt from a code audit with evidence per capability; no row is marked `PARITY` until validated against PostgreSQL.
- Deployment, handoff, decisions (ADR-N006–N009), testing, traceability, risks, open decisions, onboarding, contributing and branch policy aligned with the current code and the manual-deploy model.

### Fixed
- Inquiries v1 API scoped through organization listings (previous query referenced a non-existent relation).
- Production build: non-action exports moved out of `"use server"` modules.

## 2026-10-23

### Added
- Next.js migration foundation.
- Architecture and Laravel parity documentation.
- Contribution and agent governance.
- Product, SRS, domain, schema, design, security, testing and deployment baselines.
- Initial end-to-end product UI vertical and deployable Vercel configuration.