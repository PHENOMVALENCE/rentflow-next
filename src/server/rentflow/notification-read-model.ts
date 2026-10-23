import { db, hasDatabaseConfiguration } from "@/server/db";

export async function getUserNotifications(userId: string) {
  if (!hasDatabaseConfiguration()) {
    return {
      unread: 2,
      notifications: [
        { id: "preview-renewal", channel: "IN_APP", subject: "Lease renewal window opened", body: "Your lease is ready for renewal.", status: "PENDING", createdAt: new Date(), readAt: null },
        { id: "preview-maintenance", channel: "IN_APP", subject: "Maintenance update", body: "Your maintenance request was acknowledged.", status: "PENDING", createdAt: new Date(), readAt: null },
      ],
    };
  }

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((notification) => notification.status !== "READ").length;
  return { unread, notifications };
}

export async function getUnreadNotificationCount(userId: string) {
  if (!hasDatabaseConfiguration()) return 2;
  return db.notification.count({ where: { userId, status: { not: "READ" } } });
}
