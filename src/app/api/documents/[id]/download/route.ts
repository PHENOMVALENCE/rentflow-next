import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { getAuthorizedLeaseDocument } from "@/server/rentflow/document-access";
import { getPrivateObjectStore, StorageConfigurationError } from "@/server/storage/private-object-store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabaseConfiguration()) {
    return NextResponse.json({ error: "persistence_not_configured" }, { status: 503 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const leaseDocument = await getAuthorizedLeaseDocument(id, session);
  if (!leaseDocument) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const url = await getPrivateObjectStore().createDownloadUrl(leaseDocument.document.storageKey, 60);
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new StorageConfigurationError("Private storage returned a non-HTTPS download URL.");

    return NextResponse.redirect(parsed, { status: 307 });
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: "private_storage_not_configured" }, { status: 503 });
    }
    console.error("lease_document_download_error", error);
    return NextResponse.json({ error: "document_download_failed" }, { status: 500 });
  }
}
