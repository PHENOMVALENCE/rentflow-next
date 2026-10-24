import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { getPrivateObjectStore, StorageConfigurationError } from "@/server/storage/private-object-store";

export const runtime = "nodejs";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function GET() {
  if (!hasDatabaseConfiguration()) return NextResponse.json({ error: "persistence_not_configured" }, { status: 503 });
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const organization = await db.organization.findUnique({ where: { id: session.organizationId }, select: { settings: true } });
  if (!organization) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const branding = record(record(organization.settings).branding);
  const key = typeof branding.logoStorageKey === "string" ? branding.logoStorageKey : null;
  const mimeType = typeof branding.logoMimeType === "string" ? branding.logoMimeType : "application/octet-stream";
  if (!key) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const store = getPrivateObjectStore();
    if (store.provider === "LOCAL") {
      const bytes = await store.get(key);
      return new Response(new Uint8Array(bytes).buffer, { headers: { "Content-Type": mimeType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    }
    const url = await store.createDownloadUrl(key, 60);
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new StorageConfigurationError("Private storage returned a non-HTTPS URL.");
    return NextResponse.redirect(parsed, { status: 307 });
  } catch (error) {
    if (error instanceof StorageConfigurationError) return NextResponse.json({ error: "private_storage_not_configured" }, { status: 503 });
    console.error("organization_logo_download_error", error);
    return NextResponse.json({ error: "download_failed" }, { status: 500 });
  }
}
