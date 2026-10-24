import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getReportsSection } from "@/server/rentflow/operations-read-model";

export default async function ReportsPage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const rows = await getReportsSection(session);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Reports & audit"
        description="Authoritative operational metrics with traceable event evidence."
        action={<Link href="/app/reports/audit" className="rf-button rf-button-dark">View audit evidence</Link>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {rows.map(([name, value]) => <div className="rf-card p-6" key={name}><p className="text-sm text-[var(--muted)]">{name}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}
      </div>
      <div className="rf-card mt-6 p-6">
        <h2 className="font-semibold">Evidence trail</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">Lease transitions, payment settlement, listing changes, maintenance updates, supervisor changes, notices, inquiries, and other privileged actions write audit evidence. Use the audit viewer to inspect those events chronologically.</p>
        <Link href="/app/reports/audit" className="rf-button rf-button-light mt-5">Open audit viewer</Link>
      </div>
    </>
  );
}
