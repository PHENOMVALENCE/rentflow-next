import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Empty, PageHeader, Panel } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getReceipts } from "@/server/rentflow/payment-parity-read-model";

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireSession(["TENANT", "SUPERVISOR", "LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  const { q = "" } = await searchParams;
  const receipts = await getReceipts(session, q);

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="Receipts"
        description="Verified payment evidence for terms within your authorized scope."
        action={<Link href="/app/payments" className="rf-button rf-button-light"><AppIcon name="wallet" className="h-4 w-4" /> Payments</Link>}
      />

      <form className="rf-panel mb-5 p-4" method="get" role="search">
        <label className="sr-only" htmlFor="receipt-search">Search receipts</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rf-search flex-1">
            <AppIcon name="search" className="h-4 w-4 text-[var(--muted)]" />
            <input id="receipt-search" name="q" defaultValue={q} placeholder="Search receipt, tenant, property or unit" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>
          <button className="rf-button rf-button-dark"><AppIcon name="search" className="h-4 w-4" /> Search</button>
        </div>
      </form>

      {receipts.length === 0 ? (
        <Empty icon="file" title={q ? "No matching receipts" : "No receipts found"}>
          {q ? "Try another receipt number, tenant, property or unit." : "Verified receipts in your current scope will appear here."}
        </Empty>
      ) : (
        <Panel title="Receipt register" subtitle={`${receipts.length} ${receipts.length === 1 ? "receipt" : "receipts"} found`} flush>
          <ul className="rf-list">
            {receipts.map((receipt) => (
              <li key={receipt.id}>
                <Link href={`/app/receipts/${receipt.id}`} className="rf-list-row">
                  <span className="rf-list-icon" aria-hidden="true"><AppIcon name="file" className="h-[18px] w-[18px]" /></span>
                  <span className="rf-list-main">
                    <span className="rf-list-title block">{receipt.receiptNo}</span>
                    <span className="rf-list-meta block">{receipt.tenant} · {receipt.property} · {receipt.unit}</span>
                  </span>
                  <span className="rf-list-aside">
                    <strong className="text-sm font-semibold text-[var(--foreground)]">{receipt.amount}</strong>
                    <span className="text-xs text-[var(--muted)]">{receipt.termMonths}-month term · {receipt.issuedAt}</span>
                  </span>
                  <AppIcon name="chevron-right" className="rf-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
