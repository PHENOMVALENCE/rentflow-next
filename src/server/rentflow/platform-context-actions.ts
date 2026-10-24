"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

/**
 * Platform admin organization context (Laravel `PlatformContext`). Entering scopes the platform admin's
 * session to one organization so organization pages show that organization only; both moves are audited.
 */
export async function enterOrganizationContext(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN"]);
  if (!hasDatabaseConfiguration()) redirect("/app/platform/organizations?error=persistence");
  const parsed = z.string().cuid().safeParse(formData.get("organizationId"));
  if (!parsed.success) redirect("/app/platform/organizations?error=invalid");

  const organization = await db.organization.findUnique({ where: { id: parsed.data }, select: { id: true, active: true } });
  if (!organization) redirect("/app/platform/organizations?error=invalid");

  await db.auditLog.create({
    data: {
      actorId: session.userId,
      organizationId: organization.id,
      action: "platform.context_entered",
      resourceType: "Organization",
      resourceId: organization.id,
      metadata: { previousOrganizationId: session.organizationId },
    },
  });
  await createSession({ userId: session.userId, role: session.role, organizationId: organization.id });
  redirect("/app");
}

export async function exitOrganizationContext() {
  const session = await requireSession(["PLATFORM_ADMIN"]);
  if (hasDatabaseConfiguration() && session.organizationId) {
    await db.auditLog.create({
      data: {
        actorId: session.userId,
        organizationId: session.organizationId,
        action: "platform.context_exited",
        resourceType: "Organization",
        resourceId: session.organizationId,
      },
    });
  }
  await createSession({ userId: session.userId, role: session.role, organizationId: null });
  redirect("/app/platform/organizations");
}
