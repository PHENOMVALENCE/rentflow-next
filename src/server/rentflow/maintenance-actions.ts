"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { MaintenanceStatus } from "@prisma/client";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const createSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  tenantId: z.string().min(1),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(5).max(3000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

const allowedTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  REPORTED: ["ACKNOWLEDGED"],
  ACKNOWLEDGED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["ACKNOWLEDGED", "ASSIGNED"],
};

export async function createMaintenanceRequest(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "SUPERVISOR", "TENANT"]);
  const input = createSchema.parse({
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId") || undefined,
    tenantId: formData.get("tenantId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
  });

  const property = await db.property.findUnique({ where: { id: input.propertyId } });
  const tenant = await db.tenant.findUnique({ where: { id: input.tenantId } });
  if (!property || !tenant || property.organizationId !== tenant.organizationId) throw new Error("Invalid maintenance scope.");
  if (session.organizationId && property.organizationId !== session.organizationId) throw new Error("Property is outside your organization.");

  if (session.role === "TENANT" && tenant.userId !== session.userId) throw new Error("Tenants can only report their own maintenance requests.");
  if (session.role === "SUPERVISOR") {
    const assignment = await db.supervisorAssignment.findFirst({ where: { userId: session.userId, propertyId: property.id, active: true } });
    if (!assignment) throw new Error("Supervisor is not assigned to this property.");
  }

  await db.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({ data: { ...input, unitId: input.unitId || null, status: "REPORTED" } });
    await tx.maintenanceUpdate.create({ data: { requestId: request.id, status: "REPORTED", actorId: session.userId, note: "Request reported" } });
    await tx.auditLog.create({
      data: {
        organizationId: property.organizationId,
        actorId: session.userId,
        action: "maintenance.reported",
        resourceType: "MaintenanceRequest",
        resourceId: request.id,
      },
    });
  });

  revalidatePath("/app/maintenance");
  revalidatePath("/app");
}

export async function transitionMaintenance(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "SUPERVISOR"]);
  const requestId = z.string().min(1).parse(formData.get("requestId"));
  const nextStatus = z.enum(["REPORTED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"]).parse(formData.get("status"));
  const note = z.string().trim().max(1000).optional().parse(formData.get("note") || undefined);

  const request = await db.maintenanceRequest.findUnique({ where: { id: requestId }, include: { property: true } });
  if (!request) throw new Error("Maintenance request not found.");
  if (session.organizationId && request.property.organizationId !== session.organizationId) throw new Error("Request is outside your organization.");
  if (session.role === "SUPERVISOR") {
    const assignment = await db.supervisorAssignment.findFirst({ where: { userId: session.userId, propertyId: request.propertyId, active: true } });
    if (!assignment) throw new Error("Supervisor is not assigned to this property.");
  }
  if (!allowedTransitions[request.status].includes(nextStatus)) {
    throw new Error(`Invalid maintenance transition: ${request.status} → ${nextStatus}`);
  }

  await db.$transaction(async (tx) => {
    await tx.maintenanceRequest.update({ where: { id: request.id }, data: { status: nextStatus } });
    await tx.maintenanceUpdate.create({ data: { requestId: request.id, status: nextStatus, actorId: session.userId, note } });
    await tx.auditLog.create({
      data: {
        organizationId: request.property.organizationId,
        actorId: session.userId,
        action: "maintenance.transitioned",
        resourceType: "MaintenanceRequest",
        resourceId: request.id,
        metadata: { from: request.status, to: nextStatus },
      },
    });
  });

  revalidatePath("/app/maintenance");
  revalidatePath("/app");
}
