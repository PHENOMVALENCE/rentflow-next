import Link from "next/link";
import { PageHeader, Stat, Status } from "@/components/ui";
import { canManagePortfolio } from "@/server/auth/authorization";
import { requireSession } from "@/server/auth/session";
import { getDashboardReadModel } from "@/server/rentflow/read-model";

export default async function Dashboard() {
  const session = await requireSession();
  const { dashboard, leases, maintenance, source } = await getDashboardReadModel(session);
  const collectionWidth = `${Math.max(0, Math.min(100, Number.parseInt(dashboard.collection, 10) || 0))}%`;
  const portfolioRole = canManagePortfolio(session.role);
  const isSupervisor = session.role === "SUPERVISOR";
  const isTenant = session.role === "TENANT";

  return (
    <>
      <PageHeader
        eyebrow={isTenant ? "My rental" : isSupervisor ? "Assigned operations" : "Operations"}
        title={isTenant ? "Rental overview" : isSupervisor ? "Supervisor overview" : "Operations overview"}
        description={
          isTenant
            ? "Your lease, payment and maintenance activity only."
            : isSupervisor
              ? "Operational activity limited to properties assigned to you."
              : "Authoritative lease, payment and property activity across your portfolio."
        }
        action={portfolioRole ? <Link href="/app/properties/new" className="rf-button rf-button-dark">Add property</Link> : undefined}
      />
      {source === "demo" && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo data is displayed because DATABASE_URL is not configured. Production access switches to scoped PostgreSQL data once persistence is attached.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={isTenant ? "Properties rented" : "Properties"} value={dashboard.properties} note={`${dashboard.units} relevant units`} />
        <Stat label={isTenant ? "Protected units" : "Occupied"} value={dashboard.occupied} note={isTenant ? "Current lease relationships" : `${dashboard.listed} publicly listed`} />
        <Stat label="Renewal / grace" value={`${dashboard.renewal} / ${dashboard.grace}`} note="Requires attention" />
        <Stat label={isSupervisor ? "Open maintenance" : "Payment exceptions"} value={isSupervisor ? dashboard.maintenance : dashboard.paymentExceptions} note={isSupervisor ? "Assigned properties" : "Needs reconciliation"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="rf-card">
          <div className="flex justify-between border-b border-[var(--border)] p-5">
            <div><h2 className="font-semibold">Lease attention</h2><p className="mt-1 text-xs text-[var(--muted)]">Renewal, grace and payment milestones in your access scope</p></div>
            {session.role !== "SUPERVISOR" && <Link href="/app/leases" className="text-sm">View all →</Link>}
          </div>
          <div>
            {leases.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-strong)]">No lease milestones require attention.</p>
            ) : leases.map((lease) => (
              <div key={`${lease.tenant}-${lease.unit}`} className="flex flex-col gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">{lease.tenant}</p><p className="mt-1 text-xs text-[var(--muted)]">{lease.unit} · ends {lease.end}</p></div>
                <div className="sm:text-right"><Status>{lease.status}</Status><p className="mt-2 text-xs font-medium">{lease.amount}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rf-card p-5">
          {isSupervisor ? (
            <>
              <h2 className="font-semibold">Assigned workload</h2>
              <p className="mt-5 text-4xl font-semibold">{dashboard.maintenance}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">open maintenance requests</p>
              <p className="mt-6 text-sm font-medium">{dashboard.units} units in scope</p>
              <p className="text-xs text-[var(--muted)]">across {dashboard.properties} assigned properties</p>
            </>
          ) : (
            <>
              <h2 className="font-semibold">{isTenant ? "Payment completion" : "Portfolio collection"}</h2>
              <p className="mt-5 text-4xl font-semibold">{dashboard.collection}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">confirmed obligations</p>
              <div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: collectionWidth }} /></div>
              <p className="mt-6 text-sm font-medium">{dashboard.revenue}</p>
              <p className="text-xs text-[var(--muted)]">verified paid amount in scope</p>
            </>
          )}
        </section>
      </div>

      <section className="rf-card mt-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5"><h2 className="font-semibold">Maintenance activity</h2><Link href="/app/maintenance" className="text-sm">View workflow →</Link></div>
        {maintenance.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted-strong)]">No maintenance activity in your access scope.</p>
        ) : (
          <div className="grid md:grid-cols-3">
            {maintenance.map((item) => (
              <div key={`${item.title}-${item.property}`} className="border-b border-[var(--border)] p-5 last:border-r-0 md:border-b-0 md:border-r">
                <Status>{item.priority}</Status><p className="mt-3 font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.property} · {item.tenant}</p><p className="mt-4 text-sm">{item.status}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
