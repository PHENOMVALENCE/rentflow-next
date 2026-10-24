import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { acknowledgeLeaseDocument } from "@/server/rentflow/document-actions";
import { getTenantAgreements } from "@/server/rentflow/agreement-read-model";

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function AgreementsPage() {
  const session = await requireSession(["TENANT"]);
  const leases = await getTenantAgreements(session);

  return (
    <>
      <PageHeader eyebrow="Documents" title="Agreements" description="Lease documents available to your account. Opening or acknowledging a file records access; it is not a certified electronic signature." />
      <div className="space-y-5">
        {leases.length === 0 ? <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No agreements are linked to your account.</div> : leases.map((lease) => (
          <section key={lease.id} className="rf-card overflow-hidden">
            <div className="border-b border-[var(--border)] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{lease.unit.property.name} · {lease.unit.unitNumber}</h2><p className="mt-1 text-xs text-[var(--muted)]">{date.format(lease.startDate)} – {date.format(lease.endDate)}</p></div><Status>{lease.status}</Status></div></div>
            {lease.documents.length === 0 ? <p className="p-5 text-sm text-[var(--muted-strong)]">No documents attached to this lease.</p> : lease.documents.map((link) => {
              const acknowledged = link.acknowledgements[0];
              return <div key={link.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-medium">{link.document.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{link.kind.replaceAll("_", " ")}{link.required ? " · Required" : ""}{acknowledged ? ` · Opened ${date.format(acknowledged.acknowledgedAt)}` : ""}</p></div><div className="flex gap-2"><Link href={`/api/documents/${link.id}/download`} className="rf-button rf-button-light">Open file</Link><form action={acknowledgeLeaseDocument}><input type="hidden" name="leaseDocumentId" value={link.id} /><button type="submit" className="rf-button rf-button-dark">{acknowledged ? "Record view again" : "Acknowledge view"}</button></form></div></div>;
            })}
          </section>
        ))}
      </div>
    </>
  );
}
