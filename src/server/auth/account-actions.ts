"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { hashPin, verifyPin } from "./password";
import { UNSET_PIN_HASH } from "./pin-constants";
import { createSession, requireSession } from "./session";


const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4}$/),
  newPin: z.string().regex(/^\d{4}$/),
  confirmPin: z.string().regex(/^\d{4}$/),
});

const setupPinSchema = z.object({
  newPin: z.string().regex(/^\d{4}$/),
  confirmPin: z.string().regex(/^\d{4}$/),
});

export async function setupAccountPinAction(formData: FormData) {
  const session = await requireSession();
  const parsed = setupPinSchema.safeParse({ newPin: formData.get("newPin"), confirmPin: formData.get("confirmPin") });
  if (!parsed.success || parsed.data.newPin !== parsed.data.confirmPin) redirect("/app/pin?error=invalid");

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id: true, passwordHash: true } });
  if (!user) redirect("/login");
  if (user.passwordHash !== UNSET_PIN_HASH) redirect("/app/account");

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: hashPin(parsed.data.newPin) } }),
    db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, action: "account.pin_set", resourceType: "User", resourceId: session.userId } }),
  ]);
  await createSession({ userId: session.userId, organizationId: session.organizationId, role: session.role });
  redirect("/app/onboarding/profile");
}

export async function changeAccountPinAction(formData: FormData) {
  const session = await requireSession();
  const parsed = changePinSchema.safeParse({
    currentPin: formData.get("currentPin"),
    newPin: formData.get("newPin"),
    confirmPin: formData.get("confirmPin"),
  });
  if (!parsed.success || parsed.data.newPin !== parsed.data.confirmPin) redirect("/app/account?error=invalid");
  if (parsed.data.currentPin === parsed.data.newPin) redirect("/app/account?error=same");

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id: true, passwordHash: true } });
  if (!user?.passwordHash || !verifyPin(parsed.data.currentPin, user.passwordHash)) {
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "account.pin_change_failed",
        resourceType: "User",
        resourceId: session.userId,
        metadata: { reason: "INVALID_CURRENT_PIN" },
      },
    });
    redirect("/app/account?error=current");
  }

  await db.$transaction([
    db.user.update({ where: { id: session.userId }, data: { passwordHash: hashPin(parsed.data.newPin) } }),
    db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "account.pin_changed",
        resourceType: "User",
        resourceId: session.userId,
      },
    }),
  ]);

  await createSession({ userId: session.userId, organizationId: session.organizationId, role: session.role });
  redirect("/app/account?changed=1");
}
