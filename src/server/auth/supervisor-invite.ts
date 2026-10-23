"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "./password";
import { createSession } from "./session";

const acceptSchema = z.object({
  token: z.string().min(20),
  name: z.string().trim().min(2).max(160),
  password: z.string().min(12).max(200),
});

export async function acceptSupervisorInvite(formData: FormData): Promise<void> {
  const input = acceptSchema.parse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  const tokenHash = createHash("sha256").update(input.token).digest("hex");

  const invite = await db.supervisorInvite.findUnique({ where: { tokenHash } });
  if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) {
    redirect("/supervisors/accept?error=invalid");
  }

  const existing = await db.user.findUnique({
    where: { email: invite.email.toLowerCase() },
    include: { memberships: true },
  });
  if (existing?.memberships.some((membership) => membership.organizationId === invite.organizationId && membership.role !== "SUPERVISOR")) {
    throw new Error("This account already has a different role in the organization.");
  }

  const passwordHash = hashPassword(input.password);
  const result = await db.$transaction(async (tx) => {
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { name: input.name, passwordHash },
        })
      : await tx.user.create({
          data: {
            name: input.name,
            email: invite.email.toLowerCase(),
            role: "SUPERVISOR",
            passwordHash,
            preferredLanguage: "sw",
          },
        });

    await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId: user.id } },
      update: { role: "SUPERVISOR" },
      create: { organizationId: invite.organizationId, userId: user.id, role: "SUPERVISOR" },
    });

    await tx.supervisorInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await tx.auditLog.create({
      data: {
        organizationId: invite.organizationId,
        actorId: user.id,
        action: "supervisor.invite_accepted",
        resourceType: "SupervisorInvite",
        resourceId: invite.id,
      },
    });

    return user;
  });

  await createSession({ userId: result.id, organizationId: invite.organizationId, role: "SUPERVISOR" });
  redirect("/app");
}
