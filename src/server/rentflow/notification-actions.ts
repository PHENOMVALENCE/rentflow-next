"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

export async function markNotificationRead(formData: FormData) {
  const session = await requireSession();
  const notificationId = z.string().min(1).parse(formData.get("notificationId"));
  const notification = await db.notification.findFirst({ where: { id: notificationId, userId: session.userId } });
  if (!notification) throw new Error("Notification not found.");

  await db.notification.update({
    where: { id: notification.id },
    data: { status: "READ", readAt: new Date() },
  });
  revalidatePath("/app/notifications");
}

export async function markAllNotificationsRead() {
  const session = await requireSession();
  await db.notification.updateMany({
    where: { userId: session.userId, status: { not: "READ" } },
    data: { status: "READ", readAt: new Date() },
  });
  revalidatePath("/app/notifications");
}
