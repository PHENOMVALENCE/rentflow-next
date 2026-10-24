# Private Object Storage

RentFlow treats lease documents, operational documents and other sensitive files as **private objects**. A database `storageKey` is an opaque internal identifier, never a browser URL.

## Security rules

1. Files must be stored in a private bucket/container.
2. Browser clients never receive provider credentials or permanent object URLs.
3. Downloads pass through RentFlow authorization first.
4. After authorization, the storage adapter may issue a short-lived HTTPS download URL.
5. Lease document access is limited to authorized portfolio roles and the tenant on that lease. Property supervisor assignment alone does not grant lease/legal-document access.
6. Document acknowledgement is disabled until the object can actually be retrieved securely.
7. Uploads must validate size, content type and ownership scope before a `Document` row is committed.
8. Deletion requires an explicit privileged workflow and audit event; dangling database records or orphaned objects must be reconciled.

## Current implementation

`src/server/storage/private-object-store.ts` defines the `PrivateObjectStore` contract. The current implementation is deliberately unconfigured and throws `StorageConfigurationError` for object operations.

`GET /api/documents/:leaseDocumentId/download` performs session and lease-document authorization before asking the adapter for a signed URL. With no provider attached, the endpoint returns `503 private_storage_not_configured` rather than exposing or guessing a URL.

## Provider integration requirements

A concrete adapter must implement:

- `put({ key, bytes, mimeType })`
- `delete(key)`
- `createDownloadUrl(key, expiresInSeconds)`

The returned download URL must use HTTPS and be short-lived. Provider-specific credentials must exist only in deployment environment variables or an approved connector.

## Production gate

Do not mark private documents production-ready until:

- a private object store is attached,
- upload and download are exercised end-to-end,
- signed URL expiry is verified,
- access tests cover tenant/org/cross-org/supervisor cases,
- object deletion and orphan reconciliation are tested,
- production audit events are verified.
