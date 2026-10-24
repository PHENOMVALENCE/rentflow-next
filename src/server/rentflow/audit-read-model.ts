import { db, hasDatabaseConfiguration } from "@/server/db";

export async function getAuditEvidence(organizationId: string | null, limit = 100) {
  if (!hasDatabaseConfiguration()) {
    return [
      {
        id: "preview-audit",
        action: "lease.lifecycle_transition",
        resourceType: "Lease",
        resourceId: "preview",
        actorName: "Preview Administrator",
        createdAt: new Date(),
        metadata: { from: "ACTIVE", to: "RENEWAL_WINDOW" },
        correlationId: null,
      },
    ];
  }

  const rows = await db.auditLog.findMany({
    where: organizationId ? { organizationId } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 250)),
  });
  const actorIds = [...new Set(rows.map((row) => row.actorId).filter((value): value is string => Boolean(value)))];
  const actors = actorIds.length
    ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
    : [];
  const actorMap = new Map(actors.map((actor) => [actor.id, actor]));

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    actorName: row.actorId ? actorMap.get(row.actorId)?.name ?? "System / unavailable actor" : "System",
    createdAt: row.createdAt,
    metadata: row.metadata,
    correlationId: row.correlationId,
  }));
}
