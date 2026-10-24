import Link from "next/link";
import { AppIcon, type AppIconName } from "@/components/icons";
import { Empty, Metric, PageHeader, Panel, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getPlatformOverview } from "@/server/rentflow/platform-read-model";

const sections: readonly [slug: string, title: string, description: string, icon: AppIconName][] = [
  ["organizations", "Organizations", "Workspace health, portfolio size and membership", "building"],
  ["users", "Users", "Cross-platform account and role visibility", "users"],
  ["incidents", "Incidents", "Operational failures and acknowledgement state", "alert"],
  ["payments", "Payments", "Provider settlement and exception review", "wallet"],
  ["reconciliation", "Reconciliation", "Payment integrity and manual exceptions", "refresh"],
  ["activity", "Activity", "Cross-organization audit trail", "clock"],
  ["notifications", "Notifications", "Delivery status and lifecycle communication", "bell"],
  ["health", "Health", "Runtime and infrastructure readiness", "shield"],
  ["integrations", "Integrations", "External provider configuration status", "route"],
  ["security", "Security", "Authentication and operational security posture", "lock"],
  ["integrity", "Integrity", "Data invariants and lifecycle consistency", "check"],
  ["quality", "Quality", "Implementation and operational quality signals", "sparkles"],
  ["analytics", "Analytics", "Platform-wide portfolio metrics", "chart"],
  ["jobs", "Jobs", "Scheduled lifecycle processing and cron readiness", "clock"],
  ["sessions", "Sessions", "Authentication session policy", "user"],
  ["settings", "Settings", "Platform-level runtime configuration", "menu"],
];

export default async function PlatformHome() {
  await requireSession(["PLATFORM_ADMIN"]);
  const overview = await getPlatformOverview();

  return (
    <>
      <PageHeader eyebrow="Platform operations" title="RentFlow control center" description="Platform-wide visibility for organizations, payments, incidents, security, integrity and operational health." />

      <section aria-labelledby="platform-snapshot">
        <h2 id="platform-snapshot" className="sr-only">Platform snapshot</h2>
        <div className="rf-metrics">
          {overview.metrics.map((metric) => (
            <Metric key={metric.label} label={metric.label} value={metric.value} hint={metric.detail} icon="chart" />
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Open incidents" subtitle="Latest platform reliability events" href="/app/platform/incidents" linkLabel="View all" flush>
          {overview.incidents.length === 0 ? (
            <div className="px-5 pb-5"><Empty icon="check" title="No open incidents">There are no active reliability incidents to review.</Empty></div>
          ) : (
            <ul className="rf-list">
              {overview.incidents.map((row) => (
                <li key={row.id}>
                  {row.href ? (
                    <Link href={row.href} className="rf-list-row">
                      <span className="rf-list-icon" aria-hidden="true"><AppIcon name="alert" className="h-[18px] w-[18px]" /></span>
                      <span className="rf-list-main"><span className="rf-list-title block">{row.primary}</span><span className="rf-list-meta block">{row.secondary}</span></span>
                      <span className="rf-list-aside"><Status>{row.status}</Status>{row.meta && <span className="text-[11px] text-[var(--muted)]">{row.meta}</span>}</span>
                      <AppIcon name="chevron-right" className="rf-chevron" />
                    </Link>
                  ) : (
                    <div className="rf-list-row">
                      <span className="rf-list-icon" aria-hidden="true"><AppIcon name="alert" className="h-[18px] w-[18px]" /></span>
                      <span className="rf-list-main"><span className="rf-list-title block">{row.primary}</span><span className="rf-list-meta block">{row.secondary}</span></span>
                      <span className="rf-list-aside"><Status>{row.status}</Status>{row.meta && <span className="text-[11px] text-[var(--muted)]">{row.meta}</span>}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Organizations" subtitle="Newest platform workspaces" href="/app/platform/organizations" linkLabel="View all" flush>
          {overview.organizations.length === 0 ? (
            <div className="px-5 pb-5"><Empty icon="building" title="No organizations">Platform organizations will appear here when persistent data is available.</Empty></div>
          ) : (
            <ul className="rf-list">
              {overview.organizations.map((row) => (
                <li key={row.id}>
                  {row.href ? (
                    <Link href={row.href} className="rf-list-row">
                      <span className="rf-list-icon" aria-hidden="true"><AppIcon name="building" className="h-[18px] w-[18px]" /></span>
                      <span className="rf-list-main"><span className="rf-list-title block">{row.primary}</span><span className="rf-list-meta block">{row.secondary}</span></span>
                      <span className="rf-list-aside"><Status>{row.status}</Status>{row.meta && <span className="text-[11px] text-[var(--muted)]">{row.meta}</span>}</span>
                      <AppIcon name="chevron-right" className="rf-chevron" />
                    </Link>
                  ) : (
                    <div className="rf-list-row">
                      <span className="rf-list-icon" aria-hidden="true"><AppIcon name="building" className="h-[18px] w-[18px]" /></span>
                      <span className="rf-list-main"><span className="rf-list-title block">{row.primary}</span><span className="rf-list-meta block">{row.secondary}</span></span>
                      <span className="rf-list-aside"><Status>{row.status}</Status>{row.meta && <span className="text-[11px] text-[var(--muted)]">{row.meta}</span>}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section className="mt-6" aria-labelledby="platform-modules">
        <div className="mb-3">
          <h2 id="platform-modules" className="font-semibold text-[var(--foreground)]">Platform modules</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Operational surfaces mapped from the Laravel platform console.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sections.map(([slug, title, description, icon]) => (
            <Link href={`/app/platform/${slug}`} key={slug} className="group rf-card p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
              <span className="rf-icon-tile" aria-hidden="true"><AppIcon name={icon} /></span>
              <h3 className="mt-4 font-semibold text-[var(--foreground)]">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">Open module <AppIcon name="chevron-right" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
