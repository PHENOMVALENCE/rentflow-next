"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

export async function requestLandlordAttachment(formData: FormData) {
  const session = await requireSession(["TENANT"]);
  const organizationId = z.string().min(1).parse(formData.get("organizationId"));
  const organization = await db.organization.findFirst({ where: { id: organizationId, active: true } });
  if (!organization) throw new Error("Landlord workspace not found.");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new Error("User not found.");

  const existing = await db.tenant.findFirst({ where: { organizationId, userId: user.id } });
  if (existing?.status === "ACTIVE") redirect("/app");

  const tenant = existing ?? await db.tenant.create({
    data: {
      organizationId,
      userId: user.id,
      name: user.name,
      phone: user.phone ?? "",
      email: user.email.endsWith("@users.rentflow.local") ? null : user.email,
      status: "PENDING_ATTACHMENT",
    },
  });

  const pending = await db.tenantAttachmentRequest.findFirst({ where: { tenantId: tenant.id, kind: "LANDLORD_ATTACHMENT", status: "PENDING" } });
  if (!pending) {
    await db.tenantAttachmentRequest.create({ data: { tenantId: tenant.id, requestedBy: user.id, kind: "LANDLORD_ATTACHMENT", status: "PENDING" } });
  }

  await db.auditLog.create({
    data: { organizationId, actorId: user.id, action: "tenant.attachment_requested", resourceType: "Tenant", resourceId: tenant.id },
  });
  redirect("/app/onboarding/profile?joined=1");
}

export async function reviewLandlordAttachment(formData: FormData) {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  const requestId = z.string().min(1).parse(formData.get("requestId"));
  const decision = z.enum(["approve", "refuse"]).parse(formData.get("decision"));
  const request = await db.tenantAttachmentRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== "PENDING") throw new Error("Attachment request is no longer pending.");
  const tenant = await db.tenant.findUnique({ where: { id: request.tenantId } });
  if (!tenant || (session.organizationId && tenant.organizationId !== session.organizationId)) throw new Error("Attachment request is outside your organization.");

  await db.$transaction(async (tx) => {
    await tx.tenantAttachmentRequest.update({ where: { id: request.id }, data: { status: decision === "approve" ? "APPROVED" : "REFUSED", fulfilledAt: new Date() } });
    await tx.tenant.update({ where: { id: tenant.id }, data: { status: decision === "approve" ? "ACTIVE" : "REFUSED" } });
    await tx.auditLog.create({
      data: { organizationId: tenant.organizationId, actorId: session.userId, action: `tenant.attachment_${decision}d`, resourceType: "TenantAttachmentRequest", resourceId: request.id, metadata: { tenantId: tenant.id } },
    });
  });

  revalidatePath("/app/attachment-requests");
  revalidatePath(`/app/tenants/${tenant.id}`);
}
