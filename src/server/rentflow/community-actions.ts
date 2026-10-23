"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

export async function createCommunity(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to create a community.");

  const input = z.object({
    name: z.string().trim().min(3).max(160),
    propertyId: z.string().optional(),
  }).parse({ name: formData.get("name"), propertyId: formData.get("propertyId") || undefined });

  if (input.propertyId) {
    const property = await db.property.findFirst({ where: { id: input.propertyId, organizationId: session.organizationId } });
    if (!property) throw new Error("Property not found in this organization.");
  }

  const community = await db.community.create({
    data: { organizationId: session.organizationId, propertyId: input.propertyId ?? null, name: input.name },
  });
  await db.communityMember.create({ data: { communityId: community.id, userId: session.userId, role: "ADMIN" } });
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "community.created",
      resourceType: "Community",
      resourceId: community.id,
      metadata: { propertyId: input.propertyId ?? null },
    },
  });

  revalidatePath("/app/notices");
}

export async function joinCommunity(formData: FormData) {
  const session = await requireSession();
  const communityId = z.string().min(1).parse(formData.get("communityId"));
  const community = await db.community.findUnique({ where: { id: communityId } });
  if (!community) throw new Error("Community not found.");
  if (session.organizationId && community.organizationId !== session.organizationId) throw new Error("Community is outside your organization.");

  if (session.role === "TENANT") {
    const tenant = await db.tenant.findFirst({
      where: { userId: session.userId, organizationId: community.organizationId },
      include: { leases: { where: { status: { in: ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] } }, select: { unit: { select: { propertyId: true } } } } },
    });
    const allowed = community.propertyId === null || tenant?.leases.some((lease) => lease.unit.propertyId === community.propertyId);
    if (!allowed) throw new Error("This community is outside your active rental scope.");
  }

  if (session.role === "SUPERVISOR" && community.propertyId) {
    const assignment = await db.supervisorAssignment.findFirst({ where: { userId: session.userId, propertyId: community.propertyId, active: true } });
    if (!assignment) throw new Error("This community is outside your assigned properties.");
  }

  await db.communityMember.upsert({
    where: { communityId_userId: { communityId, userId: session.userId } },
    create: { communityId, userId: session.userId, role: "MEMBER" },
    update: {},
  });
  revalidatePath(`/app/community/${communityId}`);
}

export async function postCommunityMessage(formData: FormData) {
  const session = await requireSession();
  const input = z.object({ communityId: z.string().min(1), body: z.string().trim().min(1).max(3000) }).parse({
    communityId: formData.get("communityId"),
    body: formData.get("body"),
  });

  const membership = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId: input.communityId, userId: session.userId } },
  });
  if (!membership) throw new Error("Join this community before posting.");

  await db.communityMessage.create({ data: { communityId: input.communityId, authorId: session.userId, body: input.body } });
  revalidatePath(`/app/community/${input.communityId}`);
}

export async function reportCommunityMessage(formData: FormData) {
  const session = await requireSession();
  const input = z.object({ messageId: z.string().min(1), reason: z.string().trim().min(3).max(500) }).parse({
    messageId: formData.get("messageId"),
    reason: formData.get("reason"),
  });

  const message = await db.communityMessage.findUnique({ where: { id: input.messageId } });
  if (!message) throw new Error("Message not found.");
  const membership = await db.communityMember.findUnique({ where: { communityId_userId: { communityId: message.communityId, userId: session.userId } } });
  if (!membership) throw new Error("Only community members can report messages.");

  await db.communityMessageReport.create({ data: { messageId: message.id, reporterId: session.userId, reason: input.reason } });
  revalidatePath(`/app/community/${message.communityId}`);
}

export async function hideCommunityMessage(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "SUPERVISOR"]);
  const messageId = z.string().min(1).parse(formData.get("messageId"));
  const message = await db.communityMessage.findUnique({ where: { id: messageId }, include: { community: true } });
  if (!message) throw new Error("Message not found.");
  if (session.organizationId && message.community.organizationId !== session.organizationId) throw new Error("Community is outside your organization.");

  if (session.role === "SUPERVISOR") {
    if (!message.community.propertyId) throw new Error("Supervisors cannot moderate organization-wide communities.");
    const assignment = await db.supervisorAssignment.findFirst({ where: { userId: session.userId, propertyId: message.community.propertyId, active: true } });
    if (!assignment) throw new Error("Community is outside your assigned properties.");
  }

  await db.communityMessage.update({ where: { id: message.id }, data: { hiddenAt: new Date() } });
  await db.auditLog.create({
    data: {
      organizationId: message.community.organizationId,
      actorId: session.userId,
      action: "community.message_hidden",
      resourceType: "CommunityMessage",
      resourceId: message.id,
    },
  });
  revalidatePath(`/app/community/${message.communityId}`);
}
