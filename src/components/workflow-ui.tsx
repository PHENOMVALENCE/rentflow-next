import type { ReactNode } from "react";
import { AppIcon } from "@/components/icons";
import { Status } from "@/components/ui";

export function ReceiptSlip({
  receiptNo,
  amount,
  currency,
  issued,
  tenant,
  property,
  unit,
  reference,
  term,
  leaseDates,
  footer,
}: {
  receiptNo: string;
  amount: ReactNode;
  currency: string;
  issued: string;
  tenant: string;
  property: string;
  unit: string;
  reference: string;
  term: string;
  leaseDates: string;
  footer?: ReactNode;
}) {
  return (
    <article className="rf-receipt-slip" aria-label={`Receipt ${receiptNo}`}>
      <header className="rf-receipt-head">
        <div>
          <span className="rf-receipt-kicker">RentFlow receipt</span>
          <h2 className="rf-receipt-number">{receiptNo}</h2>
        </div>
        <span className="rf-receipt-mark" aria-hidden="true"><AppIcon name="check" /></span>
      </header>

      <div className="rf-receipt-amount">
        <span>Amount received</span>
        <strong><small>{currency}</small> {amount}</strong>
        <p>{issued}</p>
      </div>

      <dl className="rf-receipt-facts">
        <div><dt>Tenant</dt><dd>{tenant}</dd></div>
        <div><dt>Property</dt><dd>{property}</dd></div>
        <div><dt>Unit</dt><dd>{unit}</dd></div>
        <div><dt>Lease term</dt><dd>{term}</dd></div>
        <div className="rf-receipt-wide"><dt>Lease dates</dt><dd>{leaseDates}</dd></div>
        <div className="rf-receipt-wide"><dt>Internal reference</dt><dd className="rf-mono break-all">{reference}</dd></div>
      </dl>

      {footer && <footer className="rf-receipt-footer">{footer}</footer>}
    </article>
  );
}

export type TimelineItem = {
  id: string;
  status: string;
  at: string;
  note?: ReactNode;
};

export function MaintenanceTimeline({ items, empty = "No status history has been recorded yet." }: { items: TimelineItem[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="rf-panel-empty"><AppIcon name="clock" className="h-4 w-4" /> {empty}</p>;
  }

  return (
    <ol className="rf-timeline" aria-label="Maintenance status history">
      {items.map((item, index) => (
        <li key={item.id} className="rf-timeline-item">
          <span className="rf-timeline-rail" aria-hidden="true">
            <span className="rf-timeline-dot"><AppIcon name={index === 0 ? "check" : "clock"} /></span>
          </span>
          <div className="rf-timeline-content">
            <div className="rf-timeline-top">
              <Status>{item.status}</Status>
              <time className="rf-timeline-time">{item.at}</time>
            </div>
            {item.note && <div className="rf-timeline-note">{item.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
