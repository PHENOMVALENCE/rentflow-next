# Schema Parity Gaps

This document records differences that should be resolved through a reviewed Prisma migration **after PostgreSQL is attached**. The application code must not pretend these gaps are complete merely because compatibility behavior exists.

## 1. Identity credentials

Current Prisma:
- `User.email` is required and unique.
- `User.phone` is optional and not unique.
- `User.passwordHash` is the only credential hash column.

Laravel target:
- phone is the primary account identity for normal sign-in.
- account PIN has a dedicated `pin_hash` / PIN-set timestamp model.
- legacy password login may continue during migration.
- account/session invalidation is explicit.

Current Next compatibility behavior:
- phone + 4-digit PIN is implemented.
- `passwordHash` temporarily stores the PIN hash.
- session cookies are bound cryptographically to the current credential hash, so PIN changes/resets revoke old sessions.
- Briq OTP powers Forgot PIN.

Migration target:
1. add normalized phone uniqueness/indexing with a data-cleanup migration;
2. add dedicated `pinHash` and `pinSetAt` fields;
3. preserve legacy password hash only if legacy email/password sign-in remains required;
4. migrate credentials without ever materializing plaintext PINs;
5. decide whether `email` remains required after the account migration.

## 2. Platform incident lifecycle

Current Prisma enum:
- `OPEN`
- `ACKNOWLEDGED`
- `RESOLVED`

Laravel target lifecycle also includes:
- `INVESTIGATING`
- `MITIGATED`
- `CLOSED`

Current Next UI safely implements only the states that can be persisted today. Expand the enum and incident timestamps only through a reviewed migration.

## 3. Payment payload minimization

Current Prisma still contains `PaymentTransaction.rawPayload Json?`.

Application code no longer writes webhook payload fragments. Normalized fields and bounded audit metadata are authoritative. The future migration should remove `rawPayload` after confirming no production records depend on it.

## 4. SMS privacy

Current Prisma `SmsMessage` still has fields capable of storing plaintext recipient/body content.

Target design:
- store a masked recipient or stable non-reversible reference where operationally sufficient;
- do not persist message body unless a documented product/legal requirement requires it;
- store provider message ID, status, timestamps, bounded failure code and correlation metadata;
- never treat provider acceptance as delivery confirmation without a delivery receipt/webhook.

The current SMSGate adapter is test-only and does not claim delivery.

## 5. Geography references

The current `Property` model still contains text geography fields while the canonical Laravel model also has normalized region/district/ward/street-village reference tables and import evidence.

Migration target:
- add/confirm foreign-key references to canonical geography records;
- retain human-readable snapshots only if required for historical/reporting reasons;
- migrate in stages so existing property rows remain readable.

## 6. Private object metadata

The code now has an authorized object-store boundary for lease documents and listing media, but production remote storage is not connected.

Before production migration:
- select the private object-store provider;
- define provider/bucket metadata fields only if they are required;
- never expose raw storage keys on public pages;
- ensure deletion/retention policy is documented.

## 7. Migration execution rule

Do not hand-write a destructive production migration from this document. The required sequence is:

1. attach the intended PostgreSQL database;
2. snapshot/backup existing data;
3. run Prisma schema validation and migration generation in a connected development environment;
4. inspect generated SQL for destructive operations, uniqueness failures and enum changes;
5. test against a disposable copy of representative data;
6. deploy migration before enabling the code paths that depend on the new columns/states.
