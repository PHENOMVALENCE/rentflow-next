# Open Decisions

Each item blocks a roadmap milestone. Record the outcome as an ADR in `DECISIONS.md`.

| Decision | Blocks |
|---|---|
| Development and production PostgreSQL provider/connection | M1, M5 |
| Private object storage provider | M5 (agreements, documents, listing media, logos) |
| Snippe production credentials and webhook contract | M5 |
| Notification SMS provider (Briq is OTP-only today) | G4, M5 |
| Email provider for inquiry/platform/tenant-copy emails | G4 |
| WhatsApp rollout and template approval | G4, G10 |
| Backups: provider-managed snapshots vs ported backup commands | G9 |
| Bilingual (English/Swahili) scope for launch | G8 |
| Platform admin organization context model | G7 (ADR-N009 provisional) |
| Lease cron time: 01:15 EAT (Laravel) vs current 01:15 UTC | M5 |
| Final custom production domain | M6 |

Until resolved, adapters remain environment-driven and demo functionality must not fabricate external-provider success.
