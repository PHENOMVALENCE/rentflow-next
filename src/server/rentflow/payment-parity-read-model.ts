import type { Prisma, Role } from "@prisma/client";
import { db, hasDatabaseConfiguration } from "@/server/db";
import type { SessionPayload } from "@/server/auth/session";

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });

export function canReviewPaymentOperations(role: Role) {
  return role === "PLATFORM_ADMIN" || role === "LANDLORD" || role === "PROPERTY_ADMIN";
}

async function assignedPropertyIds(userId: string) {
  const rows = await db.supervisorAssignment.findMany({
    where: { userId, active: true },
    select: { propertyId: true },
  });
  return rows.map((row) => row.propertyId);
}

async function paymentScope(session: SessionPayload): Promise<Prisma.PaymentObligationWhereInput> {
  if (session.role === "TENANT") {
    return { lease: { tenant: { userId: session.userId } } };
  }

  if (session.role === "SUPERVISOR") {
    const propertyIds = await assignedPropertyIds(session.userId);
    return { lease: { unit: { propertyId: { in: propertyIds } } } };
  }

  if (session.organizationId) {
    return { lease: { unit: { property: { organizationId: session.organizationId } } } };
  }

  return {};
}

export async function getReceipts(session: SessionPayload, query?: string) {
  if (!hasDatabaseConfiguration()) return [];
  const scope = await paymentScope(session);
  const needle = query?.trim();

  const rows = await db.receipt.findMany({
    where: {
      obligation: {
        ...scope,
        ...(needle
          ? {
              OR: [
                { internalReference: { contains: needle, mode: "insensitive" } },
                { lease: { tenant: { name: { contains: needle, mode: "insensitive" } } } },
                { lease: { unit: { unitNumber: { contains: needle, mode: "insensitive" } } } },
                { lease: { unit: { property: { name: { contains: needle, mode: "insensitive" } } } } },
              ],
            }
          : {}),
      },
    },
    include: {
      obligation: {
        include: {
          lease: { include: { tenant: true, unit: { include: { property: true } } } },
        },
      },
    },
    orderBy: { issuedAt: "desc" },
  });

  return rows.map((receipt) => ({
    id: receipt.id,
    receiptNo: receipt.receiptNo,
    tenant: receipt.obligation.lease.tenant.name,
    property: receipt.obligation.lease.unit.property.name,
    unit: receipt.obligation.lease.unit.unitNumber,
    termMonths: receipt.obligation.lease.termMonths,
    amount: `${receipt.currency} ${money.format(Number(receipt.amount))}`,
    issuedAt: date.format(receipt.issuedAt),
  }));
}

export async function getReceipt(session: SessionPayload, id: string) {
  if (!hasDatabaseConfiguration()) return null;
  const scope = await paymentScope(session);
  return db.receipt.findFirst({
    where: { id, obligation: scope },
    include: {
      obligation: {
        include: {
          lease: { include: { tenant: true, unit: { include: { property: true } } } },
          transactions: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
}

export async function getPaymentExceptions(session: SessionPayload) {
  if (!hasDatabaseConfiguration() || !canReviewPaymentOperations(session.role)) return [];
  const scope = await paymentScope(session);
  return db.paymentObligation.findMany({
    where: { ...scope, status: "EXCEPTION" },
    include: {
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
      transactions: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getUnpaidTerms(session: SessionPayload) {
  if (!hasDatabaseConfiguration() || !canReviewPaymentOperations(session.role)) return { rows: [], totals: new Map<string, number>(), overdueCount: 0 };
  const scope = await paymentScope(session);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const obligations = await db.paymentObligation.findMany({
    where: { ...scope, status: { in: ["PENDING", "EXCEPTION"] } },
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
  });

  const rank = { overdue: 0, confirming: 1, upcoming: 2 } as const;
  const rows = obligations
    .map((obligation) => {
      const state = obligation.status === "EXCEPTION"
        ? "confirming" as const
        : obligation.lease.startDate <= today
          ? "overdue" as const
          : "upcoming" as const;
      return { obligation, state, renewal: Boolean(obligation.lease.predecessorLeaseId) };
    })
    .sort((a, b) => rank[a.state] - rank[b.state] || a.obligation.lease.startDate.getTime() - b.obligation.lease.startDate.getTime());

  const totals = new Map<string, number>();
  for (const row of rows) {
    const currency = row.obligation.currency;
    totals.set(currency, (totals.get(currency) ?? 0) + Number(row.obligation.amount));
  }

  return { rows, totals, overdueCount: rows.filter((row) => row.state === "overdue").length };
}
