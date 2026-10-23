"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { requireSession } from "@/server/auth/session";

const idSchema = z.string().cuid();
const resolutionSchema = z.object({
  incidentId: z.string().cuid(),
  reason: z.string().trim().min(8).max(500),
});

export async function acknowledgePlatformIncidentAction(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN"]);
  if (!hasDatabaseConfiguration()) redirect("/app/platform/incidents?error=persistence");
  const incidentId = idSchema.safeParse(formData.get("incidentId"));
  if (!incidentId.success) redirect("/app/platform/incidents?error=invalid");

  const incident = await db.platformIncident.findUnique({ where: { id: incidentId.data } });
  if (!incident || incident.status !== "OPEN") redirect("/app/platform/incidents?error=transition");

  await db.$transaction([
    db.platformIncident.update({
      where: { id: incident.id },
      data: { status: "ACKNOWLEDGED", acknowledgedAt: incident.acknowledgedAt ?? new Date() },
    }),
    db.auditLog.create({
      data: {
        actorId: session.userId,
        action: "platform.incident_acknowledged",
        resourceType: "PlatformIncident",
        resourceId: incident.id,
        correlationId: incident.correlationId,
        metadata: { from: "OPEN", to: "ACKNOWLEDGED", service: incident.service, severity: incident.severity },
      },
    }),
  ]);

  revalidatePath("/app/platform");
  revalidatePath("/app/platform/incidents");
  redirect("/app/platform/incidents?updated=1");
}

export async function resolvePlatformIncidentAction(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN"]);
  if (!hasDatabaseConfiguration()) redirect("/app/platform/incidents?error=persistence");
  const parsed = resolutionSchema.safeParse({ incidentId: formData.get("incidentId"), reason: formData.get("reason") });
  if (!parsed.success) redirect("/app/platform/incidents?error=reason");

  const incident = await db.platformIncident.findUnique({ where: { id: parsed.data.incidentId } });
  if (!incident || incident.status !== "ACKNOWLEDGED") redirect("/app/platform/incidents?error=transition");

  await db.$transaction([
    db.platformIncident.update({ where: { id: incident.id }, data: { status: "RESOLVED", resolvedAt: new Date() } }),
    db.auditLog.create({
      data: {
        actorId: session.userId,
        action: "platform.incident_resolved",
        resourceType: "PlatformIncident",
        resourceId: incident.id,
        correlationId: incident.correlationId,
        metadata: { from: "ACKNOWLEDGED", to: "RESOLVED", reason: parsed.data.reason, service: incident.service, severity: incident.severity },
      },
    }),
  ]);

  revalidatePath("/app/platform");
  revalidatePath("/app/platform/incidents");
  redirect("/app/platform/incidents?updated=1");
}
