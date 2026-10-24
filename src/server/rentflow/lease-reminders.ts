import { reminderDedupeKey, reminderFor, reminderMessage } from "@/domain/lease-reminders";
import { db } from "@/server/db";

const money = (amount: number, currency: string) => `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)}`;

/**
 * Sends today's renewal/grace reminders as in-app notifications. Idempotent: a reminder is skipped
 * when a notification with the same dedupe key already exists. Outbound SMS delivery is roadmap gap G4.
 */
export async function runLeaseReminders(now = new Date()) {
  const leases = await db.lease.findMany({
    where: { status: { in: ["RENEWAL_WINDOW", "GRACE"] }, tenant: { userId: { not: null } } },
    include: {
      tenant: { include: { organization: { select: { name: true } } } },
      unit: { include: { property: { select: { name: true } } } },
      successor: { where: { status: { in: ["DRAFT", "AWAITING_PAYMENT"] } }, include: { obligation: { select: { amount: true, currency: true } } }, take: 1 },
    },
    orderBy: { id: "asc" },
  });

  let sent = 0;
  let skipped = 0;
  for (const lease of leases) {
    const template = reminderFor(lease.status, lease.endDate, now);
    const userId = lease.tenant.userId;
    if (!template || !userId) continue;

    const dedupeKey = reminderDedupeKey(template, lease.id);
    const existing = await db.notification.findFirst({ where: { userId, metadata: { path: ["dedupeKey"], equals: dedupeKey } }, select: { id: true } });
    if (existing) {
      skipped += 1;
      continue;
    }

    // Laravel quotes the pending successor's obligation when a renewal offer exists, else the current term amount.
    const offer = lease.successor[0]?.obligation;
    const amount = offer ? money(Number(offer.amount), offer.currency) : money(Number(lease.fullTermAmount), lease.currency);
    const message = reminderMessage(template, {
      organization: lease.tenant.organization.name,
      unit: `${lease.unit.property.name} ${lease.unit.unitNumber}`,
      endDate: lease.endDate,
      amount,
    });

    await db.notification.create({
      data: {
        userId,
        channel: "IN_APP",
        subject: message.subject,
        body: message.body,
        metadata: { leaseId: lease.id, reminder: template, dedupeKey },
      },
    });
    sent += 1;
  }

  return { checked: leases.length, sent, skipped };
}
