"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { getAuthorizedLeaseDocument } from "@/server/rentflow/document-access";

export async function acknowledgeLeaseDocument(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "TENANT"]);
  const leaseDocumentId = z.string().min(1).parse(formData.get("leaseDocumentId"));
  const leaseDocument = await getAuthorizedLeaseDocument(leaseDocumentId, session);
  if (!leaseDocument) throw new Error("Lease document not found in your access scope.");

  await db.$transaction(async (tx) => {
    await tx.documentAcknowledgement.upsert({
      where: { leaseDocumentId_userId: { leaseDocumentId, userId: session.userId } },
      create: { leaseDocumentId, userId: session.userId },
      update: { acknowledgedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        organizationId: leaseDocument.lease.unit.property.organizationId,
        actorId: session.userId,
        action: "lease_document.acknowledged",
        resourceType: "LeaseDocument",
        resourceId: leaseDocument.id,
        metadata: {
          leaseId: leaseDocument.leaseId,
          documentId: leaseDocument.documentId,
          kind: leaseDocument.kind,
        },
      },
    });
  });

  revalidatePath(`/app/leases/${leaseDocument.leaseId}`);
}
