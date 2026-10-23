import Link from "next/link";
import { PageHeader, Stat, Status } from "@/components/ui";
import { getDashboardReadModel } from "@/server/rentflow/read-model";

export default async function Dashboard() {
  const { dashboard, leases, maintenance, source } = await getDashboardReadModel();
  const collectionWidth = `${Math.max(0, Math.min(100, Number.parseInt(dashboard.collection, 10) || 0))}%`;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Operations overview"
        description="Authoritative lease, payment and property activity across the portfolio."
        action={<Link href="/app/properties" className="rf-button rf-button-dark">Add property</Link>}
      />
      {source === "demo" && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo data is displayed because DATABASE_URL is not configured. The same screens automatically switch to PostgreSQL once persistence is attached.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Properties" value={dashboard.properties} note={`${dashboard.units} total units`} />
        <Stat label="Occupied" value={dashboard.occupied} note={`${dashboard.listed} publicly listed`} />
        <Stat label="Renewal / grace" value={`${dashboard.renewal} / ${dashboard.grace}`} note="Requires follow-up" />
        <Stat label="Payment exceptions" value={dashboard.paymentExceptions} note="Needs reconciliation" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="rf-card">
          <div className="flex justify-between border-b border-[var(--border)] p-5">
            <div><h2 className="font-semibold">Lease attention</h2><p className="mt-1 text-xs text-[var(--muted)]">Renewal, grace and payment milestones</p></div>
            <Link href="/app/leases" className="text-sm">View all →</Link>
          </div>
          <div>
            {leases.map((lease) => (
              <div key={`${lease.tenant}-${lease.unit}`} className="flex flex-col gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">{lease.tenant}</p><p className="mt-1 text-xs text-[var(--muted)]">{lease.unit} · ends {lease.end}</p></div>
                <div className="sm:text-right"><Status>{lease.status}</Status><p className="mt-2 text-xs font-medium">{lease.amount}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rf-card p-5">
          <h2 className="font-semibold">Portfolio collection</h2>
          <p className="mt-5 text-4xl font-semibold">{dashboard.collection}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">confirmed obligations</p>
          <div className="mt-5 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: collectionWidth }} /></div>
          <p className="mt-6 text-sm font-medium">{dashboard.revenue}</p>
          <p className="text-xs text-[var(--muted)]">confirmed this cycle</p>
        </section>
      </div>

      <section className="rf-card mt-6">
        <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Maintenance requiring action</h2></div>
        <div className="grid md:grid-cols-3">
          {maintenance.map((item) => (
            <div key={`${item.title}-${item.property}`} className="border-b border-[var(--border)] p-5 last:border-r-0 md:border-b-0 md:border-r">
              <Status>{item.priority}</Status><p className="mt-3 font-medium">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{item.property} · {item.tenant}</p><p className="mt-4 text-sm">{item.status}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
