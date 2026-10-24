import Link from "next/link";
import { notFound } from "next/navigation";
import { AppIcon } from "@/components/icons";
import { Empty, Metric, PageHeader, Panel, Status } from "@/components/ui";
import { canAccessSection, canCreateSection } from "@/server/auth/authorization";
import { requireSession, type SessionPayload } from "@/server/auth/session";
import { getAccessibleCommunities } from "@/server/rentflow/community-read-model";
import { publishListing, pauseListing } from "@/server/rentflow/listing-actions";
import {
  getLeasesSection,
  getMaintenanceSection,
  getNoticesSection,
  getPaymentsSection,
  getPropertiesSection,
  getReportsSection,
  getSupervisorsSection,
  getTenantsSection,
  getUnitsSection,
  type CardRow,
} from "@/server/rentflow/operations-read-model";
import { getListingsManagement } from "@/server/rentflow/workflow-read-model";

const allowed = ["properties", "units", "listings", "tenants", "leases", "payments", "supervisors", "maintenance", "notices", "reports", "settings"] as const;
type SectionName = (typeof allowed)[number];

const titles: Record<SectionName, string> = {
  properties: "Properties", units: "Units", listings: "Listings", tenants: "Tenants", leases: "Leases", payments: "Payments", supervisors: "Supervisors", maintenance: "Maintenance", notices: "Notices & community", reports: "Reports & audit", settings: "Settings",
};
const descriptions: Record<SectionName, string> = {
  properties: "Manage buildings, official addresses and portfolio-level operational context.",
  units: "Manage individually rentable spaces and derived occupancy.",
  listings: "Control public presentation without overriding authoritative occupancy.",
  tenants: "Manage tenant records and current rental relationships.",
  leases: "Track 3/6-month terms, renewal windows, grace and expiry.",
  payments: "Reconcile exact full-term obligations and provider results.",
  supervisors: "Assign operational responsibility by property.",
  maintenance: "Track reported issues through explicit status history.",
  notices: "Publish operational notices and use property-scoped community communication.",
  reports: "Monitor authoritative operational metrics and audit evidence.",
  settings: "Organization and platform preferences.",
};
const singular: Partial<Record<SectionName, string>> = { properties: "property", units: "unit", listings: "listing", tenants: "tenant", leases: "lease", maintenance: "request", notices: "notice" };

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section: rawSection } = await params;
  if (!allowed.includes(rawSection as SectionName)) notFound();
  const section = rawSection as SectionName;
  const session = await requireSession();
  if (!canAccessSection(session.role, section)) notFound();
  const createLabel = canCreateSection(session.role, section) ? singular[section] : undefined;
  const headerAction = section === "supervisors"
    ? <Link href="/app/supervisors/manage" className="rf-button rf-button-dark"><AppIcon name="users" className="h-4 w-4" /> Manage supervisors</Link>
    : createLabel
      ? <Link href={`/app/${section}/new`} className="rf-button rf-button-dark"><AppIcon name="plus" className="h-4 w-4" /> New {createLabel}</Link>
      : undefined;

  return (
    <>
      <PageHeader eyebrow="Operations" title={titles[section]} description={descriptions[section]} action={headerAction} />
      {await renderSection(section, session)}
    </>
  );
}

async function renderSection(section: SectionName, session: SessionPayload) {
  if (section === "properties") {
    const rows = await getPropertiesSection(session);
    if (rows.length === 0) return <Empty icon="building" title="No properties yet">Add the first property to begin building the portfolio.</Empty>;
    return (
      <Panel title="Portfolio" subtitle={`${rows.length} ${rows.length === 1 ? "property" : "properties"} in your current scope`} flush>
        <div className="overflow-x-auto">
          <div className="rf-table-head min-w-[720px]"><span>Property</span><span>Location</span><span>Occupancy</span><span>Supervisor</span></div>
          {rows.map((row) => (
            <div className="rf-table-row min-w-[720px]" key={row.id}>
              <div><p className="font-semibold text-[var(--foreground)]">{row.primary}</p></div>
              <span className="text-[var(--muted-strong)]">{row.secondary}</span>
              <span>{row.tertiary}</span>
              <span>{row.quaternary}</span>
            </div>
          ))}
        </div>
      </Panel>
    );
  }
  if (section === "units") return <Cards rows={await getUnitsSection(session)} emptyTitle="No units yet" emptyCopy="Units appear here once rentable spaces are added to the portfolio." />;
  if (section === "tenants") return <Cards rows={await getTenantsSection(session)} emptyTitle="No tenants yet" emptyCopy="Tenant records and their current rental relationships will appear here." />;
  if (section === "supervisors") return <Cards rows={await getSupervisorsSection(session)} emptyTitle="No supervisors assigned" emptyCopy="Assign supervisors to properties to expose operational responsibility here." />;

  if (section === "notices") {
    const [notices, communities] = await Promise.all([getNoticesSection(session), getAccessibleCommunities(session)]);
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Safety notices" subtitle="Organization and property-scoped operational communication">
          {notices.length === 0 ? (
            <Empty icon="alert" title="No safety notices">No safety notices are available in your current scope.</Empty>
          ) : (
            <div className="grid gap-3">
              {notices.map((notice) => (
                <Link key={notice.id} href={`/app/notices/${notice.id}`} className="group rounded-xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--border-strong)] hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
                  <div className="flex items-center justify-between gap-3"><Status>{notice.status}</Status>{notice.meta && <span className="text-xs text-[var(--muted)]">{notice.meta}</span>}</div>
                  <h3 className="mt-3 font-semibold text-[var(--foreground)]">{notice.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{notice.subtitle}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">Open notice <AppIcon name="chevron-right" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Communities" subtitle="Membership and property eligibility are checked server-side" href="/app/community" linkLabel="All communities">
          {communities.length === 0 ? (
            <Empty icon="users" title="No communities">No communities are available in your current scope.</Empty>
          ) : (
            <div className="grid gap-3">
              {communities.map((community) => (
                <Link key={community.id} href={`/app/community/${community.id}`} className="group rounded-xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--border-strong)] hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
                  <div className="flex items-center justify-between gap-3"><Status>{community.joined ? "Joined" : "Available"}</Status><span className="text-xs text-[var(--muted)]">{community.members} members</span></div>
                  <h3 className="mt-3 font-semibold text-[var(--foreground)]">{community.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{community.messages} messages · {community.propertyId ? "Property scoped" : "Organization wide"}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">Open community <AppIcon name="chevron-right" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    );
  }

  if (section === "maintenance") {
    const rows = await getMaintenanceSection(session);
    if (rows.length === 0) return <Empty icon="wrench" title="No maintenance requests">Open maintenance requests in your scope will appear here.</Empty>;
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Link href={`/app/maintenance/${row.id}`} className="group rf-card p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]" key={row.id}>
            <div className="flex items-center justify-between gap-3"><Status>{row.status}</Status>{row.meta && <span className="text-xs text-[var(--muted)]">{row.meta}</span>}</div>
            <h3 className="mt-4 font-semibold text-[var(--foreground)]">{row.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{row.subtitle}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">Open workflow <AppIcon name="chevron-right" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    );
  }

  if (section === "leases") {
    const rows = await getLeasesSection(session);
    if (rows.length === 0) return <Empty icon="calendar" title="No leases found">Leases in your permitted scope will appear here.</Empty>;
    return (
      <Panel title="Lease register" subtitle={`${rows.length} ${rows.length === 1 ? "lease" : "leases"} in scope`} flush>
        <ul className="rf-list">
          {rows.map((row) => (
            <li key={row.id} className="rf-list-row">
              <span className="rf-list-icon" aria-hidden="true"><AppIcon name="calendar" className="h-[18px] w-[18px]" /></span>
              <span className="rf-list-main"><span className="rf-list-title block">{row.tenant}</span><span className="rf-list-meta block">{row.unit} · {row.amount}</span></span>
              <span className="rf-list-aside"><Status>{row.status}</Status><span className="text-xs text-[var(--muted)]">{row.end}</span></span>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }

  if (section === "payments") {
    const rows = await getPaymentsSection(session);
    if (rows.length === 0) return <Empty icon="wallet" title="No payments found">Provider transactions in your current scope will appear here.</Empty>;
    return (
      <Panel title="Payment activity" subtitle="Provider reconciliation and authoritative payment state" flush>
        <ul className="rf-list">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`/app/payments/${row.id}`} className="rf-list-row">
                <span className="rf-list-icon" aria-hidden="true"><AppIcon name="wallet" className="h-[18px] w-[18px]" /></span>
                <span className="rf-list-main"><span className="rf-list-title block">{row.tenant}</span><span className="rf-list-meta block rf-mono">{row.reference} · {row.provider}</span></span>
                <span className="rf-list-aside"><strong className="text-sm font-semibold text-[var(--foreground)]">{row.amount}</strong><Status>{row.status}</Status></span>
                <AppIcon name="chevron-right" className="rf-chevron" />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }

  if (section === "listings") {
    const rows = await getListingsManagement(session.organizationId);
    if (rows.length === 0) return <Empty icon="home" title="No listings yet">Eligible units can be prepared and published from this workspace.</Empty>;
    return (
      <Panel title="Listing management" subtitle="Public presentation follows authoritative occupancy and eligibility" flush>
        <div>
          {rows.map((row) => (
            <div key={row.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1.4fr_.6fr_.7fr_auto] lg:items-center">
              <div><p className="font-semibold text-[var(--foreground)]">{row.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.property} · {row.unit}</p></div>
              <Status>{row.status}</Status>
              <p className="text-xs text-[var(--muted)]">Published: {row.publishedAt}</p>
              <div className="flex gap-2">
                {row.status === "Published" ? (
                  <form action={pauseListing}><input type="hidden" name="listingId" value={row.id} /><button className="rf-button rf-button-light" type="submit">Pause</button></form>
                ) : (
                  <form action={publishListing}><input type="hidden" name="listingId" value={row.id} /><button className="rf-button rf-button-dark" type="submit" disabled={!row.eligible}>Publish</button></form>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  if (section === "reports") {
    const rows = await getReportsSection(session);
    return (
      <section aria-labelledby="report-snapshot">
        <h2 id="report-snapshot" className="sr-only">Operational report snapshot</h2>
        <div className="rf-metrics">
          {rows.map(([name, value]) => <Metric key={name} label={name} value={value} icon="chart" />)}
        </div>
      </section>
    );
  }

  return (
    <Panel title="Organization settings" subtitle="Runtime and workspace configuration" className="max-w-3xl">
      <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[#f8fafc] p-4">
        <span className="rf-icon-tile shrink-0" aria-hidden="true"><AppIcon name="settings" /></span>
        <div>
          <h3 className="font-semibold text-[var(--foreground)]">Configuration is protected server-side</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Workspace identity, authentication and provider settings are controlled server-side. Sensitive provider secrets are configured only through runtime environment variables.</p>
        </div>
      </div>
    </Panel>
  );
}

function Cards({ rows, emptyTitle, emptyCopy }: { rows: CardRow[]; emptyTitle: string; emptyCopy: string }) {
  if (rows.length === 0) return <Empty icon="info" title={emptyTitle}>{emptyCopy}</Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <article className="rf-card p-5" key={row.id}>
          <div className="flex items-center justify-between gap-3"><Status>{row.status}</Status>{row.meta && <span className="text-xs text-[var(--muted)]">{row.meta}</span>}</div>
          <h3 className="mt-4 font-semibold text-[var(--foreground)]">{row.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{row.subtitle}</p>
        </article>
      ))}
    </div>
  );
}
