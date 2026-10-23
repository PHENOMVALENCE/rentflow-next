import type { SessionPayload } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

async function canViewPropertyNotice(propertyId: string, organizationId: string, session: SessionPayload) {
  if (session.role === "PLATFORM_ADMIN" || session.role === "LANDLORD" || session.role === "PROPERTY_ADMIN") {
    return !session.organizationId || session.organizationId === organizationId;
  }

  if (session.role === "SUPERVISOR") {
    return Boolean(await db.supervisorAssignment.findFirst({
      where: { userId: session.userId, propertyId, active: true },
      select: { id: true },
    }));
  }

  if (session.role === "TENANT") {
    return Boolean(await db.tenant.findFirst({
      where: {
        userId: session.userId,
        organizationId,
        leases: {
          some: {
            unit: { propertyId },
            status: { in: ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] },
          },
        },
      },
      select: { id: true },
    }));
  }

  return false;
}

export async function getSafetyNoticeDetail(id: string, session: SessionPayload) {
  if (!hasDatabaseConfiguration()) return null;

  const notice = await db.safetyNotice.findUnique({
    where: { id },
    include: {
      acknowledgements: {
        select: { userId: true, acknowledgedAt: true },
        orderBy: { acknowledgedAt: "desc" },
      },
    },
  });
  if (!notice) return null;
  if (session.organizationId && notice.organizationId !== session.organizationId) return null;
  if (notice.propertyId && !(await canViewPropertyNotice(notice.propertyId, notice.organizationId, session))) return null;

  const viewerAcknowledgement = notice.acknowledgements.find((item) => item.userId === session.userId) ?? null;

  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    severity: notice.severity,
    organizationId: notice.organizationId,
    propertyId: notice.propertyId,
    publishedAt: notice.publishedAt,
    expiresAt: notice.expiresAt,
    acknowledgementCount: notice.acknowledgements.length,
    acknowledgedAt: viewerAcknowledgement?.acknowledgedAt ?? null,
    expired: Boolean(notice.expiresAt && notice.expiresAt <= new Date()),
  };
}
