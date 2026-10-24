import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

export default async function AgreementFilePage({ params }: { params: Promise<{ document: string }> }) {
  const { document: documentId } = await params;
  const session = await requireSession();
  if (!hasDatabaseConfiguration()) notFound();
  const link = await db.leaseDocument.findFirst({
    where: {
      documentId,
      ...(session.role === "TENANT" ? { lease: { tenant: { userId: session.userId } } } : session.organizationId ? { lease: { unit: { property: { organizationId: session.organizationId } } } } : {}),
    },
    select: { id: true },
  });
  if (!link) notFound();
  redirect(`/api/documents/${link.id}/download`);
}
