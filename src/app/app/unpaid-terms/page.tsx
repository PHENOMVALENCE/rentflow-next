import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { canReviewPaymentOperations, getUnpaidTerms } from "@/server/rentflow/payment-parity-read-model";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function UnpaidTermsPage() {
  const session = await requireSession();
  if (!canReviewPaymentOperations(session.role)) notFound();
  const { rows, totals, overdueCount } = await getUnpaidTerms(session);

  return (
    <>
      <PageHeader eyebrow="Payments" title="Unpaid terms" description="Outstanding full-term obligations ordered by operational urgency." action={<Link href="/app/payments" className="rf-button rf-button-light">Payments</Link>} />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rf-card p-5"><p className="text-xs text-[var(--muted)]">Outstanding terms</p><p className="mt-2 text-2xl font-semibold">{rows.length}</p></div>
        <div className="rf-card p-5"><p className="text-xs text-[var(--muted)]">Overdue</p><p className="mt-2 text-2xl font-semibold">{overdueCount}</p></div>
        <div className="rf-card p-5"><p className="text-xs text-[var(--muted)]">Outstanding value</p><div className="mt-2 space-y-1">{totals.size === 0 ? <p className="text-2xl font-semibold">—</p> : [...totals.entries()].map(([currency, total]) => <p className="text-lg font-semibold" key={currency}>{currency} {money.format(total)}</p>)}</div></div>
      </div>
      <div className="rf-card overflow-hidden">
        {rows.length === 0 ? <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No unpaid terms found.</p> : rows.map(({ obligation, state, renewal }) => (
          <Link key={obligation.id} href={`/app/payments/${obligation.id}`} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 hover:bg-slate-50 lg:grid-cols-[1.1fr_1fr_.7fr_auto] lg:items-center">
            <div><p className="font-medium">{obligation.lease.tenant.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{obligation.lease.unit.property.name} · {obligation.lease.unit.unitNumber}</p></div>
            <div><p className="text-sm">Starts {date.format(obligation.lease.startDate)}</p><p className="mt-1 text-xs text-[var(--muted)]">{renewal ? "Renewal term" : "Initial term"} · {obligation.lease.termMonths} months</p></div>
            <span className="text-sm font-medium">{obligation.currency} {money.format(Number(obligation.amount))}</span>
            <Status>{state}</Status>
          </Link>
        ))}
      </div>
    </>
  );
}
