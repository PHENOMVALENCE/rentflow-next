import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Empty, PageHeader, Panel, Status } from "@/components/ui";
import { canCreateSection } from "@/server/auth/authorization";
import { requireSession } from "@/server/auth/session";
import { getLeasesSection } from "@/server/rentflow/operations-read-model";

export default async function LeasesPage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "TENANT"]);
  const rows = await getLeasesSection(session);
  const canCreate = canCreateSection(session.role, "leases");

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={session.role === "TENANT" ? "My leases" : "Leases"}
        description={session.role === "TENANT" ? "Your rental terms, payment state and private lease documents." : "Track lease terms, payment activation, renewal state and private documents."}
        action={canCreate ? <Link href="/app/leases/new" className="rf-button rf-button-dark"><AppIcon name="plus" className="h-4 w-4" /> New lease</Link> : undefined}
      />

      {rows.length === 0 ? (
        <Empty icon="calendar" title="No leases available">No leases are available in your current access scope.</Empty>
      ) : (
        <Panel title={session.role === "TENANT" ? "Lease history" : "Lease register"} subtitle={`${rows.length} ${rows.length === 1 ? "lease" : "leases"} in scope`} flush>
          <ul className="rf-list">
            {rows.map((row) => (
              <li key={row.id}>
                <Link href={`/app/leases/${row.id}`} className="rf-list-row">
                  <span className="rf-list-icon" aria-hidden="true"><AppIcon name="calendar" className="h-[18px] w-[18px]" /></span>
                  <span className="rf-list-main">
                    <span className="rf-list-title block">{row.tenant}</span>
                    <span className="rf-list-meta block">{row.unit} · {row.amount}</span>
                  </span>
                  <span className="rf-list-aside">
                    <Status>{row.status}</Status>
                    <span className="text-xs text-[var(--muted)]">Ends {row.end}</span>
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
