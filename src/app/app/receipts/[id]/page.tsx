import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { ReceiptSlip } from "@/components/workflow-ui";
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
      <PageHeader
        eyebrow="Receipt"
        title={receipt.receiptNo}
        description={`${lease.tenant.name} · ${lease.unit.property.name} · ${lease.unit.unitNumber}`}
        action={<Link href="/app/receipts" className="rf-button rf-button-light">Back to receipts</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
        <ReceiptSlip
          receiptNo={receipt.receiptNo}
          amount={money.format(Number(receipt.amount))}
          currency={receipt.currency}
          issued={`Issued ${date.format(receipt.issuedAt)}`}
          tenant={lease.tenant.name}
          property={lease.unit.property.name}
          unit={lease.unit.unitNumber}
          reference={receipt.obligation.internalReference}
          term={`${lease.termMonths} months`}
          leaseDates={`${date.format(lease.startDate)} – ${date.format(lease.endDate)}`}
          footer="This receipt reflects a verified RentFlow payment record. Provider reconciliation remains the authoritative settlement evidence."
        />

        <section className="rf-panel overflow-hidden" aria-labelledby="settlement-evidence">
          <header className="rf-panel-head">
            <div className="min-w-0">
              <h2 id="settlement-evidence" className="rf-panel-title">Settlement evidence</h2>
              <p className="rf-panel-sub">Provider transactions tied to this obligation</p>
            </div>
          </header>

          {receipt.obligation.transactions.length === 0 ? (
            <p className="rf-panel-empty mx-5 mb-5">No provider transactions stored.</p>
          ) : (
            <ul className="rf-list">
              {receipt.obligation.transactions.map((transaction) => (
                <li key={transaction.id} className="rf-list-row">
                  <span className="rf-list-main">
                    <span className="rf-list-title block">{transaction.providerReference ?? transaction.provider}</span>
                    <span className="rf-list-meta block">
                      {date.format(transaction.createdAt)} · {transaction.currency} {money.format(Number(transaction.receivedAmount ?? transaction.requestedAmount))}
                    </span>
                  </span>
                  <span className="rf-list-aside"><Status>{transaction.status}</Status></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
