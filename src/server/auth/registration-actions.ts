"use server";

import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { callBriqOtp } from "@/server/integrations/briq-otp";
import { hashPin } from "@/server/auth/password";
import { normalizeTanzaniaPhone } from "@/server/auth/phone";
import { createSession } from "@/server/auth/session";

const COOKIE = "rentflow_registration";
const MAX_AGE = 10 * 60;

const requestSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().min(9).max(20),
  pin: z.string().regex(/^\d{4}$/),
  pinConfirmation: z.string().regex(/^\d{4}$/),
  role: z.enum(["TENANT", "LANDLORD"]),
  organizationName: z.string().trim().max(255).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.pin !== value.pinConfirmation) ctx.addIssue({ code: "custom", path: ["pinConfirmation"], message: "PINs do not match." });
  if (value.role === "LANDLORD" && !value.organizationName) ctx.addIssue({ code: "custom", path: ["organizationName"], message: "Organization name is required." });
});

type PendingRegistration = z.infer<typeof requestSchema> & { normalizedPhone: string; exp: number };

function secret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) throw new Error("AUTH_SECRET is required for registration.");
  return value;
}

function encode(value: PendingRegistration) {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function decode(token: string | undefined): PendingRegistration | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  if (signature !== expected) return null;
  try {
    const value = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PendingRegistration;
    return value.exp > Math.floor(Date.now() / 1000) ? value : null;
  } catch {
    return null;
  }
}

export async function requestRegistrationOtp(formData: FormData) {
  if (!hasDatabaseConfiguration()) redirect("/register?error=persistence");
  const parsed = requestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone"),
    pin: formData.get("pin"),
    pinConfirmation: formData.get("pinConfirmation"),
    role: formData.get("role"),
    organizationName: formData.get("organizationName") ?? "",
  });
  if (!parsed.success) redirect("/register?error=invalid");

  let normalizedPhone: string;
  try { normalizedPhone = normalizeTanzaniaPhone(parsed.data.phone); } catch { redirect("/register?error=phone"); }
  const email = (parsed.data.email ?? "").toLowerCase();
  const existing = await db.user.findFirst({ where: { OR: [{ phone: normalizedPhone }, ...(email ? [{ email }] : [])] } });
  if (existing) redirect("/login?error=registered");

  await callBriqOtp("request", normalizedPhone);
  const pending: PendingRegistration = { ...parsed.data, email, normalizedPhone, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const jar = await cookies();
  jar.set(COOKIE, encode(pending), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
  redirect("/register/verify");
}

export async function verifyRegistrationOtp(formData: FormData) {
  const code = z.string().regex(/^\d{4}$/).safeParse(formData.get("otp"));
  if (!code.success) redirect("/register/verify?error=invalid");
  const jar = await cookies();
  const pending = decode(jar.get(COOKIE)?.value);
  if (!pending) redirect("/register?error=expired");

  const result = await callBriqOtp("verify", pending.normalizedPhone, code.data);
  if (!result.success) redirect("/register/verify?error=invalid");

  const email = pending.email || `${pending.normalizedPhone}@users.rentflow.local`;
  const created = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: pending.name, email, phone: pending.normalizedPhone, passwordHash: hashPin(pending.pin), role: pending.role },
    });
    if (pending.role === "LANDLORD") {
      const baseSlug = (pending.organizationName || pending.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "workspace";
      const organization = await tx.organization.create({ data: { name: pending.organizationName || `${pending.name}'s portfolio`, slug: `${baseSlug}-${user.id.slice(-6)}` } });
      await tx.organizationMember.create({ data: { organizationId: organization.id, userId: user.id, role: "LANDLORD" } });
      await tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, action: "registration.completed", resourceType: "User", resourceId: user.id } });
      return { user, organizationId: organization.id };
    }
    return { user, organizationId: null };
  });

  jar.delete(COOKIE);
  await createSession({ userId: created.user.id, organizationId: created.organizationId, role: created.user.role });
  redirect(created.user.role === "TENANT" ? "/app/onboarding/profile" : "/app");
}

export async function resendRegistrationOtp() {
  const jar = await cookies();
  const pending = decode(jar.get(COOKIE)?.value);
  if (!pending) redirect("/register?error=expired");
  await callBriqOtp("resend", pending.normalizedPhone);
  redirect("/register/verify?resent=1");
}
