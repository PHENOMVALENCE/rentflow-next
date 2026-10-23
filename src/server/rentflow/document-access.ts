import type { SessionPayload } from "@/server/auth/session";
import { db } from "@/server/db";

export async function getAuthorizedLeaseDocument(leaseDocumentId: string, session: SessionPayload) {
  const leaseDocument = await db.leaseDocument.findUnique({
    where: { id: leaseDocumentId },
    include: {
      document: true,
      lease: {
        include: {
          tenant: true,
          unit: { include: { property: true } },
        },
      },
      acknowledgements: {
        where: { userId: session.userId },
        take: 1,
      },
    },
  });
  if (!leaseDocument) return null;

  const organizationId = leaseDocument.lease.unit.property.organizationId;
  if (session.role === "PLATFORM_ADMIN") return leaseDocument;

  if (session.role === "LANDLORD" || session.role === "PROPERTY_ADMIN") {
    return session.organizationId === organizationId ? leaseDocument : null;
  }

  if (session.role === "TENANT") {
    return leaseDocument.lease.tenant.userId === session.userId ? leaseDocument : null;
  }

  // Supervisors do not receive lease/legal document access merely because they are assigned to a property.
  return null;
}

export async function getAuthorizedLease(leaseId: string, session: SessionPayload) {
  const lease = await db.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: true,
      unit: { include: { property: true } },
      obligation: { include: { receipt: true } },
      documents: {
        include: {
          document: true,
          acknowledgements: { where: { userId: session.userId }, take: 1 },
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!lease) return null;

  const organizationId = lease.unit.property.organizationId;
  if (session.role === "PLATFORM_ADMIN") return lease;
  if (session.role === "LANDLORD" || session.role === "PROPERTY_ADMIN") {
    return session.organizationId === organizationId ? lease : null;
  }
  if (session.role === "TENANT") return lease.tenant.userId === session.userId ? lease : null;
  return null;
}
