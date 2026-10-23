"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const profileSchema = z.object({
  tenantId: z.string().min(1),
  nationalIdLast4: z.string().trim().regex(/^\d{4}$/).optional().or(z.literal("")),
  emergencyName: z.string().trim().max(160).optional().or(z.literal("")),
  emergencyPhone: z.string().trim().max(30).optional().or(z.literal("")),
  householdSize: z.coerce.number().int().min(1).max(50).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

async function scopedTenant(tenantId: string, organizationId: string | null) {
  return db.tenant.findFirst({
    where: { id: tenantId, ...(organizationId ? { organizationId } : {}) },
    select: { id: true, organizationId: true },
  });
}

export async function updateTenantProfile(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const input = profileSchema.parse({
    tenantId: formData.get("tenantId"),
    nationalIdLast4: formData.get("nationalIdLast4") || "",
    emergencyName: formData.get("emergencyName") || "",
    emergencyPhone: formData.get("emergencyPhone") || "",
    householdSize: formData.get("householdSize") || undefined,
    notes: formData.get("notes") || "",
  });

  const tenant = await scopedTenant(input.tenantId, session.organizationId);
  if (!tenant) throw new Error("Tenant not found in your organization.");

  await db.$transaction(async (tx) => {
    await tx.tenantProfile.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        nationalIdLast4: input.nationalIdLast4 || null,
        emergencyName: input.emergencyName || null,
        emergencyPhone: input.emergencyPhone || null,
        householdSize: input.householdSize ?? null,
        notes: input.notes || null,
      },
      update: {
        nationalIdLast4: input.nationalIdLast4 || null,
        emergencyName: input.emergencyName || null,
        emergencyPhone: input.emergencyPhone || null,
        householdSize: input.householdSize ?? null,
        notes: input.notes || null,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: tenant.organizationId,
        actorId: session.userId,
        action: "tenant.profile_updated",
        resourceType: "Tenant",
        resourceId: tenant.id,
        metadata: {
          nationalIdStoredAsLast4Only: Boolean(input.nationalIdLast4),
          hasEmergencyContact: Boolean(input.emergencyName || input.emergencyPhone),
          householdSize: input.householdSize ?? null,
        },
      },
    });
  });

  revalidatePath(`/app/tenants/${tenant.id}`);
}

export async function requestTenantAttachment(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const input = z.object({
    tenantId: z.string().min(1),
    kind: z.string().trim().min(2).max(100),
    dueAt: z.string().optional(),
  }).parse({
    tenantId: formData.get("tenantId"),
    kind: formData.get("kind"),
    dueAt: formData.get("dueAt") || undefined,
  });

  const tenant = await scopedTenant(input.tenantId, session.organizationId);
  if (!tenant) throw new Error("Tenant not found in your organization.");

  const request = await db.tenantAttachmentRequest.create({
    data: {
      tenantId: tenant.id,
      requestedBy: session.userId,
      kind: input.kind,
      status: "PENDING",
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: tenant.organizationId,
      actorId: session.userId,
      action: "tenant.attachment_requested",
      resourceType: "TenantAttachmentRequest",
      resourceId: request.id,
      metadata: { tenantId: tenant.id, kind: input.kind, dueAt: request.dueAt?.toISOString() ?? null },
    },
  });

  revalidatePath(`/app/tenants/${tenant.id}`);
}

export async function cancelTenantAttachmentRequest(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const requestId = z.string().min(1).parse(formData.get("requestId"));
  const request = await db.tenantAttachmentRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Attachment request not found.");

  const tenant = await scopedTenant(request.tenantId, session.organizationId);
  if (!tenant) throw new Error("Attachment request is outside your organization.");
  if (request.status !== "PENDING") throw new Error("Only pending attachment requests can be cancelled.");

  await db.$transaction(async (tx) => {
    await tx.tenantAttachmentRequest.update({ where: { id: request.id }, data: { status: "CANCELLED" } });
    await tx.auditLog.create({
      data: {
        organizationId: tenant.organizationId,
        actorId: session.userId,
        action: "tenant.attachment_request_cancelled",
        resourceType: "TenantAttachmentRequest",
        resourceId: request.id,
        metadata: { tenantId: tenant.id },
      },
    });
  });

  revalidatePath(`/app/tenants/${tenant.id}`);
}
