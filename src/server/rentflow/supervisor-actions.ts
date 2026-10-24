"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeTanzaniaPhone } from "@/server/auth/phone";
import { requireSession } from "@/server/auth/session";
import { createSupervisorInviteToken } from "@/server/auth/supervisor-invite-token";
import { db } from "@/server/db";

export async function inviteSupervisor(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to invite supervisors.");

  const name = z.string().trim().min(2).max(160).parse(formData.get("name"));
  const email = z.string().trim().email().parse(formData.get("email")).toLowerCase();
  const phone = normalizeTanzaniaPhone(z.string().trim().min(9).max(20).parse(formData.get("phone")));
  const propertyId = z.string().cuid().parse(formData.get("propertyId"));

  const property = await db.property.findFirst({ where: { id: propertyId, organizationId: session.organizationId, active: true }, select: { id: true, name: true } });
  if (!property) throw new Error("Select an active property in this organization.");

  const rawToken = createSupervisorInviteToken({ name, phone, propertyId });
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
      metadata: {
        email,
        phone: `${phone.slice(0, 5)}****${phone.slice(-3)}`,
        propertyId,
        propertyName: property.name,
        expiresAt: expiresAt.toISOString(),
      },
    },
  });

  // The raw token carries onboarding scope and is intentionally never persisted.
  revalidatePath("/app/supervisors");
  revalidatePath("/app/supervisors/manage");
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
  revalidatePath("/app/supervisors/manage");
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
  revalidatePath("/app/supervisors/manage");
}
