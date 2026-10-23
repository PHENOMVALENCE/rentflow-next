import { db } from "@/server/db";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;

export async function isPinSignInLocked(userId: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const failures = await db.auditLog.count({
    where: {
      actorId: userId,
      action: "account.pin_sign_in_failed",
      createdAt: { gte: since },
    },
  });
  return failures >= MAX_FAILURES;
}

export async function recordPinSignInFailure(userId: string, organizationId?: string | null) {
  await db.auditLog.create({
    data: {
      organizationId: organizationId ?? null,
      actorId: userId,
      action: "account.pin_sign_in_failed",
      resourceType: "User",
      resourceId: userId,
      metadata: { method: "PIN" },
    },
  });
}

export async function recordPinSignInSuccess(userId: string, organizationId?: string | null) {
  await db.auditLog.create({
    data: {
      organizationId: organizationId ?? null,
      actorId: userId,
      action: "account.pin_sign_in_success",
      resourceType: "User",
      resourceId: userId,
      metadata: { method: "PIN" },
    },
  });
}
