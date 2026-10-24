import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getPlatformOverview } from "@/server/rentflow/platform-read-model";

const sections = [
  ["organizations", "Organizations", "Workspace health, portfolio size and membership"],
  ["users", "Users", "Cross-platform account and role visibility"],
  ["incidents", "Incidents", "Operational failures and acknowledgement state"],
  ["payments", "Payments", "Provider settlement and exception review"],
  ["reconciliation", "Reconciliation", "Payment integrity and manual exceptions"],
  ["activity", "Activity", "Cross-organization audit trail"],
  ["notifications", "Notifications", "Delivery status and lifecycle communication"],
  ["health", "Health", "Runtime and infrastructure readiness"],
  ["integrations", "Integrations", "External provider configuration status"],
  ["security", "Security", "Authentication and operational security posture"],
  ["integrity", "Integrity", "Data invariants and lifecycle consistency"],
  ["quality", "Quality", "Implementation and operational quality signals"],
  ["analytics", "Analytics", "Platform-wide portfolio metrics"],
  ["jobs", "Jobs", "Scheduled lifecycle processing and cron readiness"],
  ["sessions", "Sessions", "Authentication session policy"],
  ["settings", "Settings", "Platform-level runtime configuration"],
] as const;

export default async function PlatformHome() {
  await requireSession(["PLATFORM_ADMIN"]);
  const overview = await getPlatformOverview();

  return (
    <>
      <PageHeader eyebrow="Platform operations" title="RentFlow control center" description="Platform-wide visibility for organizations, payments, incidents, security, integrity and operational health." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.map((metric) => (
          <div key={metric.label} className="rf-card p-5">
            <p className="text-sm text-[var(--muted)]">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            <p className="mt-2 text-xs text-[var(--muted-strong)]">{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rf-card p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Open incidents</h2><p className="text-xs text-[var(--muted)]">Latest platform reliability events</p></div><Link href="/app/platform/incidents" className="text-xs font-medium">View all →</Link></div>
          <div className="space-y-3">{overview.incidents.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3"><div><p className="text-sm font-medium">{row.primary}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.secondary}</p></div><div className="text-right"><Status>{row.status}</Status>{row.meta && <p className="mt-1 text-[11px] text-[var(--muted)]">{row.meta}</p>}</div></div>)}</div>
        </section>

        <section className="rf-card p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Organizations</h2><p className="text-xs text-[var(--muted)]">Newest platform workspaces</p></div><Link href="/app/platform/organizations" className="text-xs font-medium">View all →</Link></div>
          <div className="space-y-3">{overview.organizations.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3"><div><p className="text-sm font-medium">{row.primary}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.secondary}</p></div><div className="text-right"><Status>{row.status}</Status>{row.meta && <p className="mt-1 text-[11px] text-[var(--muted)]">{row.meta}</p>}</div></div>)}</div>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3"><h2 className="font-semibold">Platform modules</h2><p className="mt-1 text-xs text-[var(--muted)]">Operational surfaces mapped from the Laravel platform console.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sections.map(([slug, title, description]) => <Link href={`/app/platform/${slug}`} key={slug} className="rf-card p-5 hover:-translate-y-0.5 hover:shadow-sm"><p className="font-medium">{title}</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p><p className="mt-4 text-xs font-medium">Open module →</p></Link>)}
        </div>
      </section>
    </>
  );
}
