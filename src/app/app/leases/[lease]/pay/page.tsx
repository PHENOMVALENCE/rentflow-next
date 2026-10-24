import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

export default async function LeasePayPage({ params }: { params: Promise<{ lease: string }> }) {
  const { lease: leaseId } = await params;
  const session = await requireSession();
  if (!hasDatabaseConfiguration()) notFound();
  const lease = await db.lease.findFirst({
    where: {
      id: leaseId,
      ...(session.role === "TENANT" ? { tenant: { userId: session.userId } } : session.organizationId ? { unit: { property: { organizationId: session.organizationId } } } : {}),
    },
    include: { obligation: true },
  });
  if (!lease?.obligation) notFound();
  redirect(`/app/payments/${lease.obligation.id}`);
}
