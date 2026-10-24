import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { markAllNotificationsRead, markNotificationRead } from "@/server/rentflow/notification-actions";
import { getUserNotifications } from "@/server/rentflow/notification-read-model";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function NotificationsPage() {
  const session = await requireSession();
  const { unread, notifications } = await getUserNotifications(session.userId);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Lease, payment, maintenance and operational notices addressed to your account."
        action={unread > 0 ? <form action={markAllNotificationsRead}><button type="submit" className="rf-button rf-button-light">Mark all read</button></form> : <Link href="/app" className="rf-button rf-button-light">Back to dashboard</Link>}
      />

      <section className="rf-card overflow-hidden">
        {notifications.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No notifications yet.</p>
        ) : notifications.map((notification) => {
          const isRead = notification.status === "READ";
          return (
            <article key={notification.id} className={`border-b border-[var(--border)] p-5 last:border-b-0 ${isRead ? "bg-white" : "bg-slate-50"}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{notification.subject ?? "RentFlow notification"}</h2><Status>{isRead ? "Read" : notification.channel}</Status></div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{notification.body}</p>
                  <p className="mt-3 text-xs text-[var(--muted)]">{date.format(notification.createdAt)}{notification.readAt ? ` · read ${date.format(notification.readAt)}` : ""}</p>
                </div>
                {!isRead && <form action={markNotificationRead}><input type="hidden" name="notificationId" value={notification.id} /><button type="submit" className="rf-button rf-button-light">Mark read</button></form>}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
