# RentFlow Next — Project Overview

**As of:** 24 October 2026 · `main` at merge of PR #2 · production not yet redeployed

## 1. What RentFlow is

RentFlow is a Tanzania-first rental operations platform. It connects public discovery of available homes, shops and offices with the full lease lifecycle: tenant onboarding, 3- or 6-month leases, exact full-term payment, renewal, grace and re-listing. Maintenance, supervisor work, notices, community, reporting and audit run alongside that lifecycle.

RentFlow Next is the Next.js rebuild of the existing Laravel product (`PHENOMVALENCE/RentFlow`). It is a **parity migration**: Laravel stays the reference for behaviour, and any intentional change is recorded as a decision (`DECISIONS.md`).

## 2. Who uses it

| Role | What they do |
|---|---|
| Public visitor | Browse available spaces by region and type, view a listing, send an enquiry. Occupied units are never shown. |
| Tenant | See their unit, lease countdown and next step; pay the exact term amount; view receipts and agreements; report maintenance; read notices and join their building's community. |
| Landlord / property admin | Manage properties, buildings, units and listings; onboard tenants; create leases; review payment exceptions and unpaid terms; assign supervisors; run reports. |
| Supervisor | Work only on assigned properties: maintenance queue, tenants in renewal or grace, enquiries, notices. No portfolio finance. |
| Platform admin | Run the platform: organizations, users, payments, reconciliation, incidents, health, integrations. Enter an organization explicitly (audited) to work inside its records. |

## 3. Core rules the system enforces

1. **Availability is derived.** A unit is listable only when no lease protects it (awaiting payment, active, renewal window, grace). A manual flag cannot override this.
2. **Lease terms are 3 or 6 months**, with one exact full-term payment obligation per term.
3. **Partial or mismatched payments never activate or renew a lease.** Only server-side provider reconciliation confirms a payment; a browser "success" page never does.
4. **Lease milestones follow East Africa Time calendar days:** renewal opens 14 days before the end, grace starts on the end date, the lease expires the day after end + 7. Transitions only move forward.
5. **Supervisors see only assigned properties; tenants see only their own records.** Every protected page and action re-checks authorization on the server.
6. **Material changes are audited.** Audit records exclude secrets and provider payloads.

## 4. How it is built

| Layer | Technology / location |
|---|---|
| Framework | Next.js 16 App Router, React 19, strict TypeScript |
| Styling | Tailwind CSS 4 with the Laravel stylesheets ported to `src/styles` (IBM Plex, blue/teal brand) |
| Data | PostgreSQL via Prisma (`prisma/schema.prisma`, 44 models) |
| Domain rules | Pure functions in `src/domain` (lease milestones, renewal, eligibility, payment matching, tenant journey, reminders) |
| Features | Read models and server actions in `src/server/rentflow` |
| Identity | Phone + 4-digit PIN, signed sessions bound to the credential; Briq OTP for registration and PIN recovery |
| Payments | Snippe adapter with signed, fresh, idempotent webhook reconciliation |
| Storage | Private object-store contract for agreements, documents and listing media (provider not yet chosen) |
| Language | English and Kiswahili; the Laravel catalog of 3,292 phrases plus 123 RentFlow Next phrases |
| Hosting | Vercel; Git deployments disabled, production deployed manually |
| Scheduling | Vercel Cron: lease milestones 01:15 EAT, lease reminders 08:00 EAT |

```text
Browser ─▶ Next.js pages & server actions ─▶ read models / actions ─▶ domain rules
                                                   │
                                                   ├─▶ PostgreSQL (Prisma)
                                                   └─▶ adapters: Snippe · Briq · SMS · private storage
```

Size today: 80 pages, 31 API/route handlers (`/api/v1/*`, webhooks, cron, downloads, health), 57 automated unit tests.

## 5. What is finished

| Area | State |
|---|---|
| Screens | Every Laravel screen has a Next.js route: public discovery and listing detail (quick view, photo viewer), registration and PIN flows, staff dashboard, tenant/supervisor/pending homes, portfolio, tenants, leases, payments, receipts, maintenance, notices, safety, community, reports, platform console with detail pages. |
| Look and feel | Laravel design system ported. Public site, sign-in, shell, dashboards, homes, reports, platform control center and detail pages, receipts (receipt slip), maintenance (timeline), leases, tenants, listings, inquiries, agreements, account and settings rebuilt with Laravel markup; the remaining staff screens use a compatibility layer that already applies the brand. |
| Lease lifecycle | Creation, payment obligation, renewal successors, nightly milestone job and daily in-app reminders. |
| Payments | Exact-amount initiation, webhook reconciliation, receipts, exception review, unpaid terms. |
| Reports | Laravel report catalog with scoped tables and CSV export. |
| Language | Public site, sign-in, menus, homes and dashboards in Kiswahili; tests fail if a used phrase lacks a translation. |
| Quality | Typecheck, lint, tests and production build pass; CI runs all four. |

## 6. What is not finished

Nothing below can be completed from code alone.

| Item | Blocked on | Roadmap |
|---|---|---|
| Real database: no Prisma migration exists and nothing has run against PostgreSQL | Attaching a development database | M1 |
| Evidence that authorization, payments and scheduling work end-to-end (integration and browser tests) | M1 | M2 |
| Outbound SMS, email and WhatsApp | Provider decisions | G4, M5 |
| Agreement/document/media upload and download | Private storage provider | M5 |
| Real payments | Snippe production credentials | M5 |
| Virtual tours | Schema field + storage | G6 |
| Kiswahili on remaining staff, platform, report and invitation screens | Translation work | G8, M4 |
| Backups | Provider-managed vs ported | G9 |
| Moving data from the Laravel app and switching over | M1–M5 | M6 |

**Status in one line:** the application is feature-complete against Laravel in code and runs in demo mode; it becomes a production system once a database, storage and providers are attached and the critical paths are verified.

## 7. Next steps

The module-by-module sequence is in `IMPLEMENTATION_ROADMAP.md`, with per-module state in `MODULE_STATUS_TRACKER.md`. In short:


1. Attach a development PostgreSQL database, close the identity schema gaps, generate and review the first migration (`ROADMAP.md` M1).
2. Add database-backed tests for the nine critical parity gates and Playwright role journeys (M2).
3. Decide the SMS, email, storage and backup providers (`OPEN_DECISIONS.md`).
4. Translate the remaining screens and port their Laravel markup (M4).
5. Plan the Laravel data import and cutover (M6).

## 8. Where to find more

| Need | Document |
|---|---|
| Status, milestones and gaps | `ROADMAP.md` |
| Module-by-module plan and status | `IMPLEMENTATION_ROADMAP.md`, `MODULE_STATUS_TRACKER.md`, `modules/` |
| Evidence per capability | `PARITY_MATRIX.md` |
| Production readiness per feature | `FEATURE_DELIVERY_RECORD.md` |
| Architecture and boundaries | `ARCHITECTURE.md` |
| Decisions (ADRs) | `DECISIONS.md` |
| Local setup and demo roles | `DEVELOPER_ONBOARDING.md` |
| Release process | `DEPLOYMENT.md`, `BRANCH_POLICY.md` |
| Security and privacy | `SECURITY.md`, `PRIVATE_STORAGE.md` |
| Tests | `TESTING.md` |

Repository: `PHENOMVALENCE/rentflow-next` · Laravel reference: `PHENOMVALENCE/RentFlow` · Production URL: `https://rentflow-next.vercel.app`
