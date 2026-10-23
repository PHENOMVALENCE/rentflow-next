"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { callBriqOtp, OtpProviderError } from "@/server/integrations/briq-otp";
import { hashPin } from "./password";
import { normalizeTanzaniaPhone } from "./phone";
import { clearPinRecoveryState, createPinRecoveryState, getPinRecoveryState } from "./pin-recovery";

const requestSchema = z.object({ phone: z.string().trim().min(9).max(20) });
const verifySchema = z.object({
  code: z.string().regex(/^\d{4}$/),
  pin: z.string().regex(/^\d{4}$/),
  confirmPin: z.string().regex(/^\d{4}$/),
});

function phoneRepresentations(phone: string) {
  return [phone, `+${phone}`, `0${phone.slice(3)}`];
}

export async function requestPinResetAction(formData: FormData) {
  if (!hasDatabaseConfiguration()) redirect("/forgot-pin?error=unavailable");

  const parsed = requestSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) redirect("/forgot-pin?error=invalid");

  let phone: string;
  try {
    phone = normalizeTanzaniaPhone(parsed.data.phone);
  } catch {
    redirect("/forgot-pin?error=invalid");
  }

  const users = await db.user.findMany({ where: { phone: { in: phoneRepresentations(phone) } }, select: { id: true }, take: 2 });

  // Avoid exposing account existence. Only an unambiguous account receives an OTP;
  // the browser follows the same flow either way.
  if (users.length === 1) {
    try {
      await callBriqOtp("request", phone);
    } catch (error) {
      if (error instanceof OtpProviderError) redirect("/forgot-pin?error=unavailable");
      throw error;
    }
  }

  await createPinRecoveryState(phone);
  redirect("/forgot-pin/verify");
}

export async function resendPinResetOtpAction() {
  const recovery = await getPinRecoveryState();
  if (!recovery) redirect("/forgot-pin?error=expired");

  const users = await db.user.findMany({ where: { phone: { in: phoneRepresentations(recovery.phone) } }, select: { id: true }, take: 2 });
  if (users.length === 1) {
    try {
      await callBriqOtp("resend", recovery.phone);
    } catch (error) {
      if (error instanceof OtpProviderError) redirect("/forgot-pin/verify?error=unavailable");
      throw error;
    }
  }

  redirect("/forgot-pin/verify?resent=1");
}

export async function verifyPinResetAction(formData: FormData) {
  if (!hasDatabaseConfiguration()) redirect("/forgot-pin?error=unavailable");
  const recovery = await getPinRecoveryState();
  if (!recovery) redirect("/forgot-pin?error=expired");

  const parsed = verifySchema.safeParse({
    code: formData.get("code"),
    pin: formData.get("pin"),
    confirmPin: formData.get("confirmPin"),
  });
  if (!parsed.success || parsed.data.pin !== parsed.data.confirmPin) redirect("/forgot-pin/verify?error=invalid");

  const users = await db.user.findMany({ where: { phone: { in: phoneRepresentations(recovery.phone) } }, select: { id: true }, take: 2 });
  if (users.length !== 1) redirect("/forgot-pin/verify?error=invalid");

  let result;
  try {
    result = await callBriqOtp("verify", recovery.phone, parsed.data.code);
  } catch (error) {
    if (error instanceof OtpProviderError) redirect("/forgot-pin/verify?error=unavailable");
    throw error;
  }

  if (!result.success || result.status_code !== 200) {
    const remaining = result.data?.remaining_attempts;
    redirect(`/forgot-pin/verify?error=code${typeof remaining === "number" ? `&remaining=${remaining}` : ""}`);
  }

  await db.$transaction([
    db.user.update({ where: { id: users[0].id }, data: { passwordHash: hashPin(parsed.data.pin) } }),
    db.auditLog.create({
      data: {
        actorId: users[0].id,
        action: "account.pin_reset",
        resourceType: "User",
        resourceId: users[0].id,
        metadata: { channel: "BRIQ_OTP" },
      },
    }),
  ]);

  await clearPinRecoveryState();
  redirect("/login?reset=1");
}
