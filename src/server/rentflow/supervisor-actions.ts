"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

export async function inviteSupervisor(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to invite supervisors.");

  const email = z.string().trim().email().parse(formData.get("email")).toLowerCase();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const invite = await db.supervisorInvite.create({
    data: { organizationId: session.organizationId, email, tokenHash, expiresAt },
  });

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "supervisor.invited",
      resourceType: "SupervisorInvite",
      resourceId: invite.id,
      metadata: { email, expiresAt: expiresAt.toISOString() },
    },
  });

  // The raw token is intentionally not persisted. A messaging adapter should deliver it immediately.
  revalidatePath("/app/supervisors");
  return { inviteId: invite.id, token: rawToken, expiresAt: expiresAt.toISOString() };
}

export async function assignSupervisor(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to assign supervisors.");

  const userId = z.string().min(1).parse(formData.get("userId"));
  const propertyId = z.string().min(1).parse(formData.get("propertyId"));

  const [member, property] = await Promise.all([
    db.organizationMember.findFirst({ where: { organizationId: session.organizationId, userId, role: "SUPERVISOR" } }),
    db.property.findFirst({ where: { id: propertyId, organizationId: session.organizationId } }),
  ]);
  if (!member || !property) throw new Error("Supervisor or property is outside this organization.");

  const assignment = await db.supervisorAssignment.upsert({
    where: { userId_propertyId: { userId, propertyId } },
    create: { userId, propertyId, active: true },
    update: { active: true, endsAt: null },
  });

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "supervisor.assigned",
      resourceType: "SupervisorAssignment",
      resourceId: assignment.id,
      metadata: { propertyId, userId },
    },
  });

  revalidatePath("/app/supervisors");
}

export async function unassignSupervisor(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to change assignments.");
  const assignmentId = z.string().min(1).parse(formData.get("assignmentId"));

  const assignment = await db.supervisorAssignment.findFirst({
    where: { id: assignmentId, property: { organizationId: session.organizationId } },
  });
  if (!assignment) throw new Error("Assignment not found.");

  await db.supervisorAssignment.update({ where: { id: assignment.id }, data: { active: false, endsAt: new Date() } });
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "supervisor.unassigned",
      resourceType: "SupervisorAssignment",
      resourceId: assignment.id,
    },
  });

  revalidatePath("/app/supervisors");
}
