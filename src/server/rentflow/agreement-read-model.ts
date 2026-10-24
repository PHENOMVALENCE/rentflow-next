import { db, hasDatabaseConfiguration } from "@/server/db";
import type { SessionPayload } from "@/server/auth/session";

export async function getTenantAgreements(session: SessionPayload) {
  if (!hasDatabaseConfiguration() || session.role !== "TENANT") return [];

  return db.lease.findMany({
    where: { tenant: { userId: session.userId } },
    include: {
      unit: { include: { property: true } },
      documents: {
        include: {
          document: true,
          acknowledgements: { where: { userId: session.userId } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
