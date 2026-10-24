"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { UNSET_PIN_HASH } from "@/server/auth/account-actions";
import { normalizeTanzaniaPhone } from "@/server/auth/phone";
import { createSession, requireSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { callBriqOtp } from "@/server/integrations/briq-otp";

const TOKEN_TTL_HOURS = 48;

async function resolveInvite(token: string) {
  const invite = await db.shortLink.findUnique({ where: { code: token } });
  if (!invite || !invite.destination.startsWith("tenant-invite:") || (invite.expiresAt && invite.expiresAt <= new Date())) return null;
  const tenantId = invite.destination.slice("tenant-invite:".length);
  if (!tenantId) return null;
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, include: { organization: true } });
  if (!tenant || tenant.userId) return null;
  return { invite, tenant };
}

export async function issueTenantInvite(formData: FormData) {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  const tenantId = z.string().min(1).parse(formData.get("tenantId"));
  const tenant = await db.tenant.findFirst({ where: { id: tenantId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) } });
  if (!tenant) throw new Error("Tenant not found in your organization.");
  if (tenant.userId) redirect(`/app/tenants/${tenant.id}?error=already-linked`);

  const token = randomBytes(32).toString("base64url");
  const destination = `tenant-invite:${tenant.id}`;
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await db.$transaction(async (tx) => {
    await tx.shortLink.deleteMany({ where: { destination } });
    await tx.shortLink.create({ data: { code: token, destination, expiresAt } });
    await tx.auditLog.create({ data: { organizationId: tenant.organizationId, actorId: session.userId, action: "tenant.invite_issued", resourceType: "Tenant", resourceId: tenant.id, metadata: { expiresAt: expiresAt.toISOString() } } });
  });

  redirect(`/app/tenants/${tenant.id}/invite?token=${encodeURIComponent(token)}`);
}

export async function requestTenantInviteOtp(formData: FormData) {
  const token = z.string().min(20).max(120).parse(formData.get("token"));
  const resolved = await resolveInvite(token);
  if (!resolved) redirect(`/invite/${encodeURIComponent(token)}?error=expired`);
  let phone: string;
  try { phone = normalizeTanzaniaPhone(resolved.tenant.phone); } catch { redirect(`/invite/${encodeURIComponent(token)}?error=phone`); }
  await callBriqOtp("request", phone);
  redirect(`/invite/${encodeURIComponent(token)}?sent=1`);
}

export async function verifyTenantInviteOtp(formData: FormData) {
  const parsed = z.object({ token: z.string().min(20).max(120), otp: z.string().regex(/^\d{4}$/) }).safeParse({ token: formData.get("token"), otp: formData.get("otp") });
  if (!parsed.success) redirect(`/invite/${encodeURIComponent(String(formData.get("token") ?? ""))}?error=otp`);
  const resolved = await resolveInvite(parsed.data.token);
  if (!resolved) redirect(`/invite/${encodeURIComponent(parsed.data.token)}?error=expired`);

  let phone: string;
  try { phone = normalizeTanzaniaPhone(resolved.tenant.phone); } catch { redirect(`/invite/${encodeURIComponent(parsed.data.token)}?error=phone`); }
  const verified = await callBriqOtp("verify", phone, parsed.data.otp);
  if (!verified.success) redirect(`/invite/${encodeURIComponent(parsed.data.token)}?sent=1&error=otp`);

  const attached = await db.$transaction(async (tx) => {
    const existingByPhone = await tx.user.findFirst({ where: { phone } });
    const existingByEmail = resolved.tenant.email ? await tx.user.findUnique({ where: { email: resolved.tenant.email } }) : null;
    const existing = existingByPhone ?? existingByEmail;
    if (existing && existing.role !== "TENANT") throw new Error("This account already operates an organization and cannot be attached as a tenant login.");
    if (existing) {
      const otherTenant = await tx.tenant.findFirst({ where: { userId: existing.id, id: { not: resolved.tenant.id } } });
      if (otherTenant) throw new Error("This account is already linked to another tenant record.");
      const otherOrganization = await tx.organizationMember.findFirst({ where: { userId: existing.id, organizationId: { not: resolved.tenant.organizationId } } });
      if (otherOrganization) throw new Error("This account already belongs to another organization.");
    }

    const user = existing ?? await tx.user.create({
      data: {
        name: resolved.tenant.name,
        email: resolved.tenant.email || `${phone}@users.rentflow.local`,
        phone,
        passwordHash: UNSET_PIN_HASH,
        role: "TENANT",
      },
    });

    await tx.tenant.update({ where: { id: resolved.tenant.id }, data: { userId: user.id, status: "ACTIVE", email: resolved.tenant.email || (user.email.endsWith("@users.rentflow.local") ? null : user.email) } });
    await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: resolved.tenant.organizationId, userId: user.id } },
      create: { organizationId: resolved.tenant.organizationId, userId: user.id, role: "TENANT" },
      update: { role: "TENANT" },
    });
    await tx.tenantAttachmentRequest.updateMany({ where: { tenantId: resolved.tenant.id, status: "PENDING" }, data: { status: "APPROVED", fulfilledAt: new Date() } });
    await tx.shortLink.delete({ where: { id: resolved.invite.id } });
    await tx.auditLog.create({ data: { organizationId: resolved.tenant.organizationId, actorId: user.id, action: "tenant.invite_accepted", resourceType: "Tenant", resourceId: resolved.tenant.id, metadata: { accountStatus: "ACTIVE" } } });
    return user;
  });

  await createSession({ userId: attached.id, organizationId: resolved.tenant.organizationId, role: "TENANT" });
  redirect(attached.passwordHash === UNSET_PIN_HASH ? "/app/pin" : "/app/onboarding/profile");
}
