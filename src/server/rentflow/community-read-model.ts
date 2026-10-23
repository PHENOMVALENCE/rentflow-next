import type { SessionPayload } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

async function allowedPropertyIds(session: SessionPayload) {
  if (session.role === "SUPERVISOR") {
    const assignments = await db.supervisorAssignment.findMany({
      where: { userId: session.userId, active: true },
      select: { propertyId: true },
    });
    return assignments.map((item) => item.propertyId);
  }

  if (session.role === "TENANT") {
    const tenant = await db.tenant.findFirst({
      where: { userId: session.userId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) },
      include: {
        leases: {
          where: { status: { in: ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] } },
          select: { unit: { select: { propertyId: true } } },
        },
      },
    });
    return tenant ? [...new Set(tenant.leases.map((lease) => lease.unit.propertyId))] : [];
  }

  return null;
}

export async function getAccessibleCommunities(session: SessionPayload) {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "preview-community", name: "Residents community", propertyId: null, members: 12, messages: 24, joined: true },
    ];
  }

  const propertyIds = await allowedPropertyIds(session);
  const rows = await db.community.findMany({
    where: {
      ...(session.organizationId ? { organizationId: session.organizationId } : {}),
      ...(propertyIds ? { OR: [{ propertyId: null }, { propertyId: { in: propertyIds } }] } : {}),
    },
    include: {
      _count: { select: { members: true, messages: true } },
      members: { where: { userId: session.userId }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((community) => ({
    id: community.id,
    name: community.name,
    propertyId: community.propertyId,
    members: community._count.members,
    messages: community._count.messages,
    joined: community.members.length > 0,
  }));
}

export async function getCommunityDetail(id: string, session: SessionPayload) {
  if (!hasDatabaseConfiguration()) return null;

  const propertyIds = await allowedPropertyIds(session);
  const community = await db.community.findFirst({
    where: {
      id,
      ...(session.organizationId ? { organizationId: session.organizationId } : {}),
      ...(propertyIds ? { OR: [{ propertyId: null }, { propertyId: { in: propertyIds } }] } : {}),
    },
    include: {
      members: { where: { userId: session.userId }, take: 1 },
      messages: {
        where: { hiddenAt: null },
        include: { reports: { where: { reporterId: session.userId }, select: { id: true } } },
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });
  if (!community) return null;

  const authorIds = [...new Set(community.messages.map((message) => message.authorId))];
  const authors = authorIds.length
    ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, role: true } })
    : [];
  const authorMap = new Map(authors.map((author) => [author.id, author]));

  return {
    id: community.id,
    name: community.name,
    propertyId: community.propertyId,
    joined: community.members.length > 0,
    messages: community.messages.map((message) => ({
      id: message.id,
      body: message.body,
      authorId: message.authorId,
      authorName: authorMap.get(message.authorId)?.name ?? "Community member",
      authorRole: authorMap.get(message.authorId)?.role ?? null,
      createdAt: message.createdAt,
      reportedByViewer: message.reports.length > 0,
    })),
  };
}
