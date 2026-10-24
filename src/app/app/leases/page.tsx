import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
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
        action={canCreate ? <Link href="/app/leases/new" className="rf-button rf-button-dark">New lease</Link> : undefined}
      />

      <div className="rf-card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No leases are available in your access scope.</p>
        ) : rows.map((row) => (
          <Link key={row.id} href={`/app/leases/${row.id}`} className="flex flex-col gap-4 border-b border-[var(--border)] p-5 last:border-b-0 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-medium">{row.tenant}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.unit} · {row.amount}</p></div>
            <div className="sm:text-right"><Status>{row.status}</Status><p className="mt-2 text-xs text-[var(--muted)]">Ends {row.end} · Open workspace →</p></div>
          </Link>
        ))}
      </div>
    </>
  );
}
