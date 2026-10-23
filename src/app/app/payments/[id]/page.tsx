import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { initiateLeasePayment } from "@/server/payments/actions";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function PaymentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ initiated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireSession(["TENANT", "LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Payments" title="Payment obligation" description="Exact-term payment execution requires the production database and Snippe credentials." />
        <div className="rf-card max-w-2xl p-6"><p className="text-sm text-[var(--muted-strong)]">The preview environment is read-only for payments.</p><Link href="/app/payments" className="rf-button rf-button-light mt-5">Back to payments</Link></div>
      </>
    );
  }

  const obligation = await db.paymentObligation.findUnique({
    where: { id },
    include: {
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
      transactions: { orderBy: { createdAt: "desc" } },
      receipt: true,
    },
  });
  if (!obligation) notFound();

  const organizationId = obligation.lease.unit.property.organizationId;
  if (session.organizationId && session.organizationId !== organizationId) notFound();
  if (session.role === "TENANT" && obligation.lease.tenant.userId !== session.userId) notFound();

  const payable = obligation.status === "PENDING" || obligation.status === "EXCEPTION";

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title={obligation.internalReference}
        description={`${obligation.lease.tenant.name} · ${obligation.lease.unit.property.name} · ${obligation.lease.unit.unitNumber}`}
        action={<Link href="/app/payments" className="rf-button rf-button-light">Back</Link>}
      />

      {query.initiated === "1" && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Payment request initiated. Lease activation still waits for the verified Snippe webhook.</div>}

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="rf-card p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[var(--muted)]">Exact full-term amount</p><p className="mt-1 text-3xl font-semibold">TZS {money.format(Number(obligation.amount))}</p></div><Status>{obligation.status}</Status></div>
          <dl className="mt-6 space-y-4 border-t border-[var(--border)] pt-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Lease term</dt><dd>{obligation.lease.termMonths} months</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Start</dt><dd>{date.format(obligation.lease.startDate)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">End</dt><dd>{date.format(obligation.lease.endDate)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Lease state</dt><dd>{obligation.lease.status.replaceAll("_", " ")}</dd></div>
            {obligation.receipt && <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Receipt</dt><dd>{obligation.receipt.receiptNo}</dd></div>}
          </dl>

          {payable && (
            <form action={initiateLeasePayment} className="mt-6 border-t border-[var(--border)] pt-5">
              <input type="hidden" name="obligationId" value={obligation.id} />
              <label className="block text-sm font-medium">Mobile money number<input name="phone" required defaultValue={obligation.lease.tenant.phone} inputMode="tel" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">RentFlow sends only the exact TZS obligation to Snippe. This button does not mark the lease paid.</p>
              <button className="rf-button rf-button-dark mt-5 w-full" type="submit">Request mobile money payment</button>
            </form>
          )}
        </section>

        <section className="rf-card overflow-hidden">
          <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Provider activity</h2><p className="mt-1 text-xs text-[var(--muted)]">Settlement evidence and exceptions</p></div>
          {obligation.transactions.length === 0 ? <p className="p-6 text-sm text-[var(--muted-strong)]">No payment attempts recorded.</p> : obligation.transactions.map((transaction) => (
            <div key={transaction.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><p className="font-medium">{transaction.providerReference ?? "Provider attempt"}</p><p className="mt-1 text-xs text-[var(--muted)]">{transaction.provider} · {date.format(transaction.createdAt)} · TZS {money.format(Number(transaction.receivedAmount ?? transaction.requestedAmount))}</p>{transaction.failureReason && <p className="mt-2 text-xs text-red-700">{transaction.failureReason}</p>}</div>
              <Status>{transaction.status}</Status>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
