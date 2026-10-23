"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { callBriqOtp, OtpProviderError } from "@/server/integrations/briq-otp";
import { hashPin } from "./password";
import { normalizeTanzaniaPhone } from "./phone";
import { createSession } from "./session";
import { decodeSupervisorInviteToken } from "@/server/rentflow/supervisor-actions";

const tokenSchema = z.string().min(20);
const acceptSchema = z.object({
  token: tokenSchema,
  code: z.string().regex(/^\d{4}$/),
  pin: z.string().regex(/^\d{4}$/),
  confirmPin: z.string().regex(/^\d{4}$/),
});

function inviteUrl(token: string, query = "") {
  return `/supervisors/accept?token=${encodeURIComponent(token)}${query}`;
}

function phoneRepresentations(phone: string) {
  return [phone, `+${phone}`, `0${phone.slice(3)}`];
}

async function resolveInvite(token: string) {
  const payload = decodeSupervisorInviteToken(token);
  if (!payload) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invite = await db.supervisorInvite.findUnique({ where: { tokenHash } });
  if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) return null;
  return { invite, payload };
}

export async function requestSupervisorInviteOtp(formData: FormData): Promise<void> {
  const token = tokenSchema.safeParse(formData.get("token"));
  if (!token.success) redirect("/supervisors/accept?error=invalid");
  const resolved = await resolveInvite(token.data);
  if (!resolved) redirect("/supervisors/accept?error=invalid");

  const operation = formData.get("operation") === "resend" ? "resend" : "request";
  try {
    await callBriqOtp(operation, resolved.payload.phone);
  } catch (error) {
    if (error instanceof OtpProviderError) redirect(inviteUrl(token.data, "&error=otp_unavailable"));
    throw error;
  }

  redirect(inviteUrl(token.data, operation === "resend" ? "&sent=1&resent=1" : "&sent=1"));
}

export async function acceptSupervisorInvite(formData: FormData): Promise<void> {
  const input = acceptSchema.safeParse({
    token: formData.get("token"),
    code: formData.get("code"),
    pin: formData.get("pin"),
    confirmPin: formData.get("confirmPin"),
  });
  if (!input.success) redirect("/supervisors/accept?error=invalid");
  if (input.data.pin !== input.data.confirmPin) redirect(inviteUrl(input.data.token, "&sent=1&error=pin_mismatch"));

  const resolved = await resolveInvite(input.data.token);
  if (!resolved) redirect("/supervisors/accept?error=invalid");
  const { invite, payload } = resolved;

  let verification;
  try {
    verification = await callBriqOtp("verify", payload.phone, input.data.code);
  } catch (error) {
    if (error instanceof OtpProviderError) redirect(inviteUrl(input.data.token, "&sent=1&error=otp_unavailable"));
    throw error;
  }
  if (!verification.success || verification.status_code !== 200) {
    const remaining = verification.data?.remaining_attempts;
    redirect(inviteUrl(input.data.token, `&sent=1&error=code${typeof remaining === "number" ? `&remaining=${remaining}` : ""}`));
  }

  const property = await db.property.findFirst({
    where: { id: payload.propertyId, organizationId: invite.organizationId, active: true },
    select: { id: true },
  });
  if (!property) redirect(inviteUrl(input.data.token, "&error=scope"));

  const phoneUsers = await db.user.findMany({
    where: { phone: { in: phoneRepresentations(payload.phone) } },
    include: { memberships: true },
    take: 2,
  });
  if (phoneUsers.length > 1) redirect(inviteUrl(input.data.token, "&error=identity"));

  const emailUser = await db.user.findUnique({
    where: { email: invite.email.toLowerCase() },
    include: { memberships: true },
  });
  const phoneUser = phoneUsers[0] ?? null;
  if (phoneUser && emailUser && phoneUser.id !== emailUser.id) redirect(inviteUrl(input.data.token, "&error=identity"));
  const existing = phoneUser ?? emailUser;

  if (existing) {
    const normalizedExistingPhone = existing.phone ? normalizeTanzaniaPhone(existing.phone) : null;
    if (normalizedExistingPhone && normalizedExistingPhone !== payload.phone) redirect(inviteUrl(input.data.token, "&error=identity"));
    if (existing.memberships.some((membership) => membership.organizationId === invite.organizationId && membership.role !== "SUPERVISOR")) {
      redirect(inviteUrl(input.data.token, "&error=role"));
    }
  }

  const pinHash = hashPin(input.data.pin);
  const result = await db.$transaction(async (tx) => {
    const freshInvite = await tx.supervisorInvite.findUnique({ where: { id: invite.id } });
    if (!freshInvite || freshInvite.acceptedAt || freshInvite.expiresAt <= new Date()) throw new Error("SUPERVISOR_INVITE_NOT_USABLE");

    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { name: payload.name, phone: payload.phone, passwordHash: pinHash },
        })
      : await tx.user.create({
          data: {
            name: payload.name,
            email: invite.email.toLowerCase(),
            phone: payload.phone,
            role: "SUPERVISOR",
            passwordHash: pinHash,
            preferredLanguage: "sw",
          },
        });

    await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId: user.id } },
      update: { role: "SUPERVISOR" },
      create: { organizationId: invite.organizationId, userId: user.id, role: "SUPERVISOR" },
    });

    await tx.supervisorAssignment.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId: property.id } },
      update: { active: true, endsAt: null },
      create: { userId: user.id, propertyId: property.id, active: true },
    });

    await tx.supervisorInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await tx.auditLog.create({
      data: {
        organizationId: invite.organizationId,
        actorId: user.id,
        action: "supervisor.invite_accepted",
        resourceType: "SupervisorInvite",
        resourceId: invite.id,
        metadata: { propertyId: property.id, channel: "BRIQ_OTP" },
      },
    });

    return user;
  });

  await createSession({ userId: result.id, organizationId: invite.organizationId, role: "SUPERVISOR" });
  redirect("/app");
}
