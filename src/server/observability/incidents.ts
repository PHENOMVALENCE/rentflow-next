import type { Prisma } from "@prisma/client";
import { db, hasDatabaseConfiguration } from "@/server/db";

export type IncidentSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export async function recordPlatformIncident(input: {
  service: string;
  severity: IncidentSeverity;
  summary: string;
  correlationId?: string;
  details?: Record<string, unknown>;
}) {
  if (!hasDatabaseConfiguration()) return null;

  try {
    return await db.platformIncident.create({
      data: {
        service: input.service,
        severity: input.severity,
        status: "OPEN",
        summary: input.summary.slice(0, 500),
        correlationId: input.correlationId ?? null,
        details: input.details as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("platform_incident_recording_failed", error);
    return null;
  }
}

export async function resolvePlatformIncident(id: string) {
  if (!hasDatabaseConfiguration()) return null;
  return db.platformIncident.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}
