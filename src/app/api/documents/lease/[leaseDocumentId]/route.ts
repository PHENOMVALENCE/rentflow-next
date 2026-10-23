import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { getAuthorizedLeaseDocument } from "@/server/rentflow/document-access";
import { privateStorage } from "@/server/storage/private-storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ leaseDocumentId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leaseDocumentId } = await params;
  const leaseDocument = await getAuthorizedLeaseDocument(leaseDocumentId, session);
  if (!leaseDocument) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const stored = await privateStorage().getObject(leaseDocument.document.storageKey);
    return new Response(stored.body, {
      headers: {
        "Content-Type": stored.contentType || leaseDocument.document.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(leaseDocument.document.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("lease document storage read failed", {
      leaseDocumentId,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json({ error: "Document storage is unavailable" }, { status: 503 });
  }
}
