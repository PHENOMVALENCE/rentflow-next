"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const noticeSchema = z.object({
  propertyId: z.string().optional(),
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(5).max(5000),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  expiresAt: z.string().optional(),
});

export async function publishSafetyNotice(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "SUPERVISOR"]);
  if (!session.organizationId) throw new Error("An organization is required to publish notices.");

  const input = noticeSchema.parse({
    propertyId: formData.get("propertyId") || undefined,
    title: formData.get("title"),
    body: formData.get("body"),
    severity: formData.get("severity"),
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (input.propertyId) {
    const property = await db.property.findFirst({ where: { id: input.propertyId, organizationId: session.organizationId } });
    if (!property) throw new Error("Property not found in this organization.");
    if (session.role === "SUPERVISOR") {
      const assignment = await db.supervisorAssignment.findFirst({ where: { userId: session.userId, propertyId: input.propertyId, active: true } });
      if (!assignment) throw new Error("Supervisor is not assigned to this property.");
    }
  } else if (session.role === "SUPERVISOR") {
    throw new Error("Supervisors may only publish notices for assigned properties.");
  }

  const notice = await db.safetyNotice.create({
    data: {
      organizationId: session.organizationId,
      propertyId: input.propertyId || null,
      title: input.title,
      body: input.body,
      severity: input.severity,
      publishedAt: new Date(),
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "notice.published",
      resourceType: "SafetyNotice",
      resourceId: notice.id,
      metadata: { severity: input.severity, propertyId: input.propertyId ?? null },
    },
  });

  revalidatePath("/app/notices");
}

export async function acknowledgeSafetyNotice(formData: FormData) {
  const session = await requireSession();
  const noticeId = z.string().min(1).parse(formData.get("noticeId"));
  const notice = await db.safetyNotice.findUnique({ where: { id: noticeId } });
  if (!notice) throw new Error("Notice not found.");
  if (session.organizationId && notice.organizationId !== session.organizationId) {
    throw new Error("Notice is outside your organization.");
  }

  if (notice.propertyId && session.role === "TENANT") {
    const tenant = await db.tenant.findFirst({
      where: {
        userId: session.userId,
        organizationId: notice.organizationId,
        leases: {
          some: {
            unit: { propertyId: notice.propertyId },
            status: { in: ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] },
          },
        },
      },
      select: { id: true },
    });
    if (!tenant) throw new Error("This notice is outside your active rental scope.");
  }

  if (notice.propertyId && session.role === "SUPERVISOR") {
    const assignment = await db.supervisorAssignment.findFirst({
      where: { userId: session.userId, propertyId: notice.propertyId, active: true },
      select: { id: true },
    });
    if (!assignment) throw new Error("This notice is outside your assigned properties.");
  }

  await db.$transaction(async (tx) => {
    await tx.safetyNoticeAcknowledgement.upsert({
      where: { noticeId_userId: { noticeId, userId: session.userId } },
      create: { noticeId, userId: session.userId },
      update: { acknowledgedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        organizationId: notice.organizationId,
        actorId: session.userId,
        action: "notice.acknowledged",
        resourceType: "SafetyNotice",
        resourceId: notice.id,
        metadata: { propertyId: notice.propertyId },
      },
    });
  });

  revalidatePath("/app/notices");
  revalidatePath(`/app/notices/${notice.id}`);
}
