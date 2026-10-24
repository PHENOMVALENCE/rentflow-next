import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { canReviewPaymentOperations, getPaymentExceptions } from "@/server/rentflow/payment-parity-read-model";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });

export default async function PaymentExceptionsPage() {
  const session = await requireSession();
  if (!canReviewPaymentOperations(session.role)) notFound();
  const exceptions = await getPaymentExceptions(session);

  return (
    <>
      <PageHeader eyebrow="Payments" title="Payment exceptions" description="Obligations that need management review after provider or reconciliation exceptions." action={<Link href="/app/payments" className="rf-button rf-button-light">Payments</Link>} />
      <div className="rf-card overflow-hidden">
        {exceptions.length === 0 ? <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No payment exceptions need review.</p> : exceptions.map((obligation) => {
          const latest = obligation.transactions[0];
          return (
            <Link key={obligation.id} href={`/app/payments/${obligation.id}`} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 hover:bg-slate-50 lg:grid-cols-[1.1fr_1fr_.7fr_auto] lg:items-center">
              <div><p className="font-medium">{obligation.internalReference}</p><p className="mt-1 text-xs text-[var(--muted)]">{obligation.lease.tenant.name}</p></div>
              <div><p className="text-sm">{obligation.lease.unit.property.name} · {obligation.lease.unit.unitNumber}</p><p className="mt-1 text-xs text-[var(--muted)]">{latest?.failureReason ?? "Review settlement evidence"}</p></div>
              <span className="text-sm font-medium">{obligation.currency} {money.format(Number(obligation.amount))}</span>
              <Status>{obligation.status}</Status>
            </Link>
          );
        })}
      </div>
    </>
  );
}
