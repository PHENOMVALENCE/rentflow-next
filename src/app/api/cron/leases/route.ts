import { leaseStateAt, type LeaseState } from "@/domain/rentflow";
import { db } from "@/server/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const leases = await db.lease.findMany({
    where: { status: { in: ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] } },
    include: { tenant: true, unit: { include: { listing: true } } },
  });

  let processed = 0;
  const transitions: Record<string, number> = {};

  for (const lease of leases) {
    const next = leaseStateAt({
      status: lease.status as LeaseState,
      endDate: lease.endDate,
      now,
    });
    if (next === lease.status) continue;

    await db.$transaction(async (tx) => {
      await tx.lease.update({ where: { id: lease.id }, data: { status: next } });

      if (next === "RENEWAL_WINDOW" && lease.tenant.userId) {
        await tx.notification.create({
          data: {
            userId: lease.tenant.userId,
            channel: "IN_APP",
            subject: "Lease renewal window opened",
            body: `Your lease for unit ${lease.unit.unitNumber} is ready for renewal.`,
            metadata: { leaseId: lease.id },
          },
        });
      }

      if (next === "GRACE" && lease.tenant.userId) {
        await tx.notification.create({
          data: {
            userId: lease.tenant.userId,
            channel: "IN_APP",
            subject: "Lease grace period",
            body: `The lease for unit ${lease.unit.unitNumber} has ended and is now in the 7-day grace period.`,
            metadata: { leaseId: lease.id },
          },
        });
      }

      if (next === "EXPIRED" && lease.unit.listingEnabled) {
        if (lease.unit.listing) {
          await tx.propertyListing.update({
            where: { unitId: lease.unitId },
            data: { status: "ELIGIBLE" },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: "lease.lifecycle_transition",
          resourceType: "Lease",
          resourceId: lease.id,
          metadata: { from: lease.status, to: next, processedAt: now.toISOString() },
        },
      });
    });

    transitions[next] = (transitions[next] ?? 0) + 1;
    processed += 1;
  }

  return Response.json({ ok: true, processed, transitions, checked: leases.length });
}
