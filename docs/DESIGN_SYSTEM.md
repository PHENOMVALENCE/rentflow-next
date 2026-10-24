# RentFlow Design System

The visual direction is derived from the Proxima Living reference used by the Laravel product, adapted into semantic RentFlow tokens.

## Principles

- State before decoration.
- Clear hierarchy and generous whitespace.
- White elevated surfaces on light neutral background.
- Blue/teal action family.
- Rounded cards and controls.
- Strong, readable typography.
- Status meaning always includes text/icon, not colour alone.

## Tokens

The Laravel stylesheets are the source of truth and are ported, not re-invented:

- `src/styles/rentflow.css` ← `resources/css/app.css` (Tailwind `@theme`: IBM Plex, primary `#1890ff`/`#096dd9`, accent `#13c2c2`, canvas `#f5f7fb`, radii, motion).
- `src/styles/app-ui.css` ← `resources/css/app-ui.css` (authenticated shell, metrics, panels, lists, status badges).
- `src/styles/public.css` ← `resources/css/public.css` (public site, listing pages, guest/auth flows).
- `src/app/globals.css` adds semantic aliases (`--background`, `--brand`, `--muted`…) and a compatibility layer so older `rf-button-*`, `rf-badge-*` and `rf-field` screens render in the baseline style.

Deviations from the Laravel files: Livewire/Alpine-only selectors are removed, and `.rf-card` carries no default padding because migrated screens set their own. Fonts are self-hosted with `@fontsource/ibm-plex-*` instead of the Bunny CDN.

When a Laravel stylesheet changes, re-copy it and re-apply these deviations.

## Components

React ports keep the Blade class names, so styling stays shared:

- `AppShell` (`layouts/app`), `navigationFor` (`layouts/partials/nav`), `AppIcon`/`PubIcon` (icon partials)
- `PageHeader`, `Metric`/`Stat`, `Status`, `Panel`, `Empty`, `Progress` in `src/components/ui.tsx` (`x-rf.*`)
- `PublicLayout`, `PublicNavbar`, `HeroSearch`, `ListingResults`, `PropertyCard`, `AuthLayout` in `src/components/pub/*` (`x-pub.*`)

Component inventory (Laravel source → state):

| Component | Laravel | State |
|---|---|---|
| App shell, sidebar, account menu | `layouts/app`, `partials/nav*` | Ported |
| Page header | `x-rf.page-head` | Ported |
| Metric / KPI | `x-rf.metric`, `x-rf.kpi` | Ported |
| Status badge | `x-rf.status` | Ported |
| Panel, list rows, attention item | `x-rf.panel`, `x-rf.attention-item` | Ported |
| Empty state | `x-rf.empty` | Ported |
| Progress | `x-rf.progress` | Ported |
| Avatar | `x-rf.avatar` | Ported |
| Public navbar, footer, brand, state | `x-pub.*` | Ported |
| Listing card, property image | `x-pub.property-card`, `property-image` | Ported |
| Property tile | `x-rf.property-tile` | Pending (dashboard) |
| Lease countdown / rail | `x-rf.countdown` | Pending |
| Receipt slip | `x-rf.receipt-slip` | Pending |
| Maintenance timeline | `maintenance/partials/timeline` | Pending |
| Charts | `x-rf.line-chart`, `x-rf.donut-chart` | Pending |
| Dialog, file preview | `x-rf.dialog`, `x-rf.file-preview*` | Pending |
| Household, person, SMS components | `x-rf.household`, `person`, `sms-*` | Pending |
| Language switcher / prompt | `x-rf.language-*` | Pending (G8) |
| Quick view, gallery lightbox, virtual tour | `public/partials/*` | Pending (G6) |

Pending components are scheduled in `ROADMAP.md` M3–M4.

## Responsive behavior

Phone: top bar/drawer and stacked cards.
Tablet: compact rail/two-column content.
Desktop: persistent role sidebar and dense operational layouts.

## Accessibility

Visible focus, semantic buttons/links/labels, minimum touch targets, contrast-aware text and reduced-motion-friendly transitions.