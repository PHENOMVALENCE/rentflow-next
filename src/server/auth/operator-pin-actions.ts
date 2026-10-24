"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { requireSession } from "./session";

const resetSchema = z.object({
  targetUserId: z.string().cuid(),
  returnPath: z.string().startsWith("/app/").max(300),
});

export async function resetManagedAccountPinAction(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!hasDatabaseConfiguration()) redirect("/app?error=persistence");

  const parsed = resetSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    returnPath: formData.get("returnPath"),
  });
  if (!parsed.success || parsed.data.targetUserId === session.userId) redirect("/app?error=pin_reset_denied");

  const target = await db.user.findUnique({
    where: { id: parsed.data.targetUserId },
    include: {
      memberships: true,
    },
  });
  if (!target || target.role === "PLATFORM_ADMIN" || target.role === "LANDLORD" || target.role === "PROPERTY_ADMIN") {
    redirect(`${parsed.data.returnPath}?error=pin_reset_denied`);
  }

  if (session.role !== "PLATFORM_ADMIN") {
    if (!session.organizationId) redirect(`${parsed.data.returnPath}?error=pin_reset_denied`);

    const isTenantHere = await db.tenant.count({
      where: { organizationId: session.organizationId, userId: target.id },
    });
    const isSupervisorHere = target.memberships.some((membership) => membership.organizationId === session.organizationId && membership.role === "SUPERVISOR");
    if (!isTenantHere && !isSupervisorHere) redirect(`${parsed.data.returnPath}?error=pin_reset_denied`);
  }

  await db.$transaction([
    db.user.update({ where: { id: target.id }, data: { passwordHash: null } }),
    db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "account.pin_reset_by_operator",
        resourceType: "User",
        resourceId: target.id,
        metadata: { targetRole: target.role },
      },
    }),
  ]);

  revalidatePath(parsed.data.returnPath);
  redirect(`${parsed.data.returnPath}?pinReset=1`);
}
