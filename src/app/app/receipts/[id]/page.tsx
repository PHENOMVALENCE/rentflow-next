import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getReceipt } from "@/server/rentflow/payment-parity-read-model";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(["TENANT", "SUPERVISOR", "LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  const receipt = await getReceipt(session, id);
  if (!receipt) notFound();
  const lease = receipt.obligation.lease;

  return (
    <>
      <PageHeader eyebrow="Receipt" title={receipt.receiptNo} description={`${lease.tenant.name} · ${lease.unit.property.name} · ${lease.unit.unitNumber}`} action={<Link href="/app/receipts" className="rf-button rf-button-light">Back to receipts</Link>} />
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rf-card p-6">
          <p className="text-xs text-[var(--muted)]">Amount received</p>
          <p className="mt-1 text-3xl font-semibold">{receipt.currency} {money.format(Number(receipt.amount))}</p>
          <dl className="mt-6 space-y-4 border-t border-[var(--border)] pt-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Issued</dt><dd>{date.format(receipt.issuedAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Reference</dt><dd className="font-mono text-xs">{receipt.obligation.internalReference}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Lease term</dt><dd>{lease.termMonths} months</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Lease dates</dt><dd>{date.format(lease.startDate)} – {date.format(lease.endDate)}</dd></div>
          </dl>
        </section>
        <section className="rf-card overflow-hidden">
          <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Settlement evidence</h2><p className="mt-1 text-xs text-[var(--muted)]">Provider transactions tied to this obligation</p></div>
          {receipt.obligation.transactions.length === 0 ? <p className="p-6 text-sm text-[var(--muted-strong)]">No provider transactions stored.</p> : receipt.obligation.transactions.map((transaction) => (
            <div key={transaction.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><p className="font-medium">{transaction.providerReference ?? transaction.provider}</p><p className="mt-1 text-xs text-[var(--muted)]">{date.format(transaction.createdAt)} · {transaction.currency} {money.format(Number(transaction.receivedAmount ?? transaction.requestedAmount))}</p></div>
              <Status>{transaction.status}</Status>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
