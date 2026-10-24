"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

export async function acknowledgeIncident(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN"]);
  const id = z.string().min(1).parse(formData.get("incidentId"));
  const incident = await db.platformIncident.findUnique({ where: { id } });
  if (!incident) throw new Error("Incident not found.");
  if (incident.status === "RESOLVED") throw new Error("Resolved incidents cannot be acknowledged again.");

  await db.$transaction(async (tx) => {
    await tx.platformIncident.update({ where: { id }, data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() } });
    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        action: "platform_incident.acknowledged",
        resourceType: "PlatformIncident",
        resourceId: id,
      },
    });
  });
  revalidatePath("/app/reports/incidents");
}

export async function resolveIncident(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN"]);
  const id = z.string().min(1).parse(formData.get("incidentId"));
  const incident = await db.platformIncident.findUnique({ where: { id } });
  if (!incident) throw new Error("Incident not found.");

  await db.$transaction(async (tx) => {
    await tx.platformIncident.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() } });
    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        action: "platform_incident.resolved",
        resourceType: "PlatformIncident",
        resourceId: id,
      },
    });
  });
  revalidatePath("/app/reports/incidents");
}
