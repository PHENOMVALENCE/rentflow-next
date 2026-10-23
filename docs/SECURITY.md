# Security Baseline

## Access control

Authentication identifies the user; authorization is enforced per server action/route/resource. UI visibility is not authorization.

## Sensitive data

Never commit or log passwords, auth tokens, provider secrets, mobile-money PINs, full provider payloads, agreement files, or unnecessary household data.

## Payments

Verify callback/provider identity where supported; validate internal/provider reference, currency and exact amount; reconcile idempotently inside a transaction.

## Files

Private agreement/operational documents require authenticated, authorized access. Public listing images are separate from private documents.

## Webhooks

Reject invalid signatures/identities and malformed payloads. Store only safe fields necessary for reconciliation and audit.

## Secrets

Production secrets live in Vercel environment variables or connected secret stores. `.env*` files with real values are ignored.