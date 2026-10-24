import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Empty, PageHeader, Panel, Status } from "@/components/ui";
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

      {leases.length === 0 ? (
        <Empty icon="file" title="No agreements linked">Lease documents linked to your account will appear here.</Empty>
      ) : (
        <div className="space-y-5">
          {leases.map((lease) => (
            <Panel
              key={lease.id}
              title={`${lease.unit.property.name} · ${lease.unit.unitNumber}`}
              subtitle={`${date.format(lease.startDate)} – ${date.format(lease.endDate)}`}
              action={<Status>{lease.status}</Status>}
              flush
            >
              {lease.documents.length === 0 ? (
                <div className="px-5 pb-5"><Empty icon="file" title="No documents attached">This lease does not have any available documents yet.</Empty></div>
              ) : (
                <ul className="rf-list">
                  {lease.documents.map((link) => {
                    const acknowledged = link.acknowledgements[0];
                    return (
                      <li key={link.id} className="rf-list-row">
                        <span className="rf-list-icon" aria-hidden="true"><AppIcon name="file" className="h-[18px] w-[18px]" /></span>
                        <span className="rf-list-main">
                          <span className="rf-list-title block">{link.document.name}</span>
                          <span className="rf-list-meta block">{link.kind.replaceAll("_", " ")}{link.required ? " · Required" : ""}{acknowledged ? ` · Opened ${date.format(acknowledged.acknowledgedAt)}` : ""}</span>
                        </span>
                        <span className="flex flex-wrap gap-2 lg:justify-end">
                          <Link href={`/api/documents/${link.id}/download`} className="rf-button rf-button-light"><AppIcon name="eye" className="h-4 w-4" /> Open file</Link>
                          <form action={acknowledgeLeaseDocument}>
                            <input type="hidden" name="leaseDocumentId" value={link.id} />
                            <button type="submit" className="rf-button rf-button-dark"><AppIcon name="check" className="h-4 w-4" /> {acknowledged ? "Record view again" : "Acknowledge view"}</button>
                          </form>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
