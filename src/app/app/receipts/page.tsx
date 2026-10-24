import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getReceipts } from "@/server/rentflow/payment-parity-read-model";

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireSession(["TENANT", "SUPERVISOR", "LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  const { q = "" } = await searchParams;
  const receipts = await getReceipts(session, q);

  return (
    <>
      <PageHeader eyebrow="Payments" title="Receipts" description="Verified payment evidence for terms within your authorized scope." action={<Link href="/app/payments" className="rf-button rf-button-light">Payments</Link>} />
      <form className="rf-card mb-5 flex gap-3 p-4" method="get">
        <input name="q" defaultValue={q} placeholder="Search receipt, tenant, property or unit" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-sm" />
        <button className="rf-button rf-button-dark">Search</button>
      </form>
      <div className="rf-card overflow-hidden">
        {receipts.length === 0 ? <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No receipts found.</p> : receipts.map((receipt) => (
          <Link key={receipt.id} href={`/app/receipts/${receipt.id}`} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 hover:bg-slate-50 md:grid-cols-[1fr_1fr_.7fr_auto] md:items-center">
            <div><p className="font-medium">{receipt.receiptNo}</p><p className="mt-1 text-xs text-[var(--muted)]">{receipt.tenant}</p></div>
            <div><p className="text-sm">{receipt.property} · {receipt.unit}</p><p className="mt-1 text-xs text-[var(--muted)]">{receipt.termMonths}-month term</p></div>
            <span className="text-sm font-medium">{receipt.amount}</span>
            <span className="text-xs text-[var(--muted)] md:text-right">{receipt.issuedAt}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
