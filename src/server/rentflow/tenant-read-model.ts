import { db, hasDatabaseConfiguration } from "@/server/db";

export async function getTenantManagementDetail(id: string, organizationId: string | null) {
  if (!hasDatabaseConfiguration()) return null;

  const tenant = await db.tenant.findFirst({
    where: { id, ...(organizationId ? { organizationId } : {}) },
    include: {
      profile: true,
      leases: {
        include: {
          unit: { include: { property: true } },
          obligation: true,
        },
        orderBy: { endDate: "desc" },
      },
    },
  });
  if (!tenant) return null;

  const attachmentRequests = await db.tenantAttachmentRequest.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return { tenant, attachmentRequests };
}
