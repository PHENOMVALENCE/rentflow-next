import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
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
    ? <Link href="/app/supervisors/manage" className="rf-button rf-button-dark">Manage supervisors</Link>
    : createLabel
      ? <Link href={`/app/${section}/new`} className="rf-button rf-button-dark">New {createLabel}</Link>
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
    return <div className="rf-card overflow-hidden"><div className="rf-table-head"><span>Property</span><span>Location</span><span>Occupancy</span><span>Supervisor</span></div>{rows.map((row) => <div className="rf-table-row" key={row.id}><div><p className="font-medium">{row.primary}</p></div><span>{row.secondary}</span><span>{row.tertiary}</span><span>{row.quaternary}</span></div>)}</div>;
  }
  if (section === "units") return <Cards rows={await getUnitsSection(session)} />;
  if (section === "tenants") return <Cards rows={await getTenantsSection(session)} />;
  if (section === "supervisors") return <Cards rows={await getSupervisorsSection(session)} />;

  if (section === "notices") {
    const [notices, communities] = await Promise.all([getNoticesSection(session), getAccessibleCommunities(session)]);
    return (
      <div className="space-y-6">
        <section>
          <div className="mb-3"><h2 className="font-semibold">Safety notices</h2><p className="mt-1 text-xs text-[var(--muted)]">Organization and property-scoped operational communication</p></div>
          {notices.length === 0 ? <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No safety notices are available in your scope.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{notices.map((notice) => <Link key={notice.id} href={`/app/notices/${notice.id}`} className="rf-card p-5"><div className="flex items-center justify-between gap-3"><Status>{notice.status}</Status>{notice.meta && <span className="text-xs text-[var(--muted)]">{notice.meta}</span>}</div><h3 className="mt-4 font-semibold">{notice.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{notice.subtitle}</p><p className="mt-4 text-xs font-medium">Open notice →</p></Link>)}</div>}
        </section>
        <section>
          <div className="mb-3"><h2 className="font-semibold">Communities</h2><p className="mt-1 text-xs text-[var(--muted)]">Membership and property eligibility are checked server-side.</p></div>
          {communities.length === 0 ? <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No communities are available in your scope.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{communities.map((community) => <Link key={community.id} href={`/app/community/${community.id}`} className="rf-card p-5"><div className="flex items-center justify-between gap-3"><Status>{community.joined ? "Joined" : "Available"}</Status><span className="text-xs text-[var(--muted)]">{community.members} members</span></div><h3 className="mt-4 font-semibold">{community.name}</h3><p className="mt-1 text-sm text-[var(--muted)]">{community.messages} messages · {community.propertyId ? "Property scoped" : "Organization wide"}</p><p className="mt-4 text-xs font-medium">Open community →</p></Link>)}</div>}
        </section>
      </div>
    );
  }

  if (section === "maintenance") {
    const rows = await getMaintenanceSection(session);
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <Link href={`/app/maintenance/${row.id}`} className="rf-card p-5" key={row.id}><div className="flex items-center justify-between gap-3"><Status>{row.status}</Status>{row.meta && <span className="text-xs text-[var(--muted)]">{row.meta}</span>}</div><h3 className="mt-4 font-semibold">{row.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{row.subtitle}</p><p className="mt-4 text-xs font-medium">Open workflow →</p></Link>)}</div>;
  }

  if (section === "leases") {
    const rows = await getLeasesSection(session);
    return <div className="rf-card">{rows.map((row) => <div key={row.id} className="flex justify-between gap-4 border-b border-[var(--border)] p-5 last:border-b-0"><div><p className="font-medium">{row.tenant}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.unit} · {row.amount}</p></div><div className="text-right"><Status>{row.status}</Status><p className="mt-2 text-xs">{row.end}</p></div></div>)}</div>;
  }

  if (section === "payments") {
    const rows = await getPaymentsSection(session);
    return <div className="rf-card">{rows.map((row) => <Link href={`/app/payments/${row.id}`} key={row.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-4 md:items-center hover:bg-slate-50"><div><p className="font-mono text-xs">{row.reference}</p><p className="mt-1 font-medium">{row.tenant}</p></div><span>{row.amount}</span><span>{row.provider}</span><span className="md:text-right"><Status>{row.status}</Status></span></Link>)}</div>;
  }

  if (section === "listings") {
    const rows = await getListingsManagement(session.organizationId);
    return <div className="rf-card overflow-hidden">{rows.map((row) => <div key={row.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1.4fr_.6fr_.7fr_auto] lg:items-center"><div><p className="font-medium">{row.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.property} · {row.unit}</p></div><Status>{row.status}</Status><p className="text-xs text-[var(--muted)]">Published: {row.publishedAt}</p><div className="flex gap-2">{row.status === "Published" ? <form action={pauseListing}><input type="hidden" name="listingId" value={row.id} /><button className="rf-button rf-button-light" type="submit">Pause</button></form> : <form action={publishListing}><input type="hidden" name="listingId" value={row.id} /><button className="rf-button rf-button-dark" type="submit" disabled={!row.eligible}>Publish</button></form>}</div></div>)}</div>;
  }

  if (section === "reports") {
    const rows = await getReportsSection(session);
    return <div className="grid gap-4 md:grid-cols-3">{rows.map(([name, value]) => <div className="rf-card p-6" key={name}><p className="text-sm text-[var(--muted)]">{name}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>;
  }

  return <div className="rf-card max-w-2xl p-6"><h2 className="font-semibold">Organization settings</h2><p className="mt-2 text-sm text-[var(--muted-strong)]">Workspace identity, authentication and provider settings are controlled server-side. Sensitive provider secrets are configured only through runtime environment variables.</p></div>;
}

function Cards({ rows }: { rows: CardRow[] }) {
  if (rows.length === 0) return <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No records found.</div>;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <div className="rf-card p-5" key={row.id}><div className="flex items-center justify-between gap-3"><Status>{row.status}</Status>{row.meta && <span className="text-xs text-[var(--muted)]">{row.meta}</span>}</div><h3 className="mt-4 font-semibold">{row.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{row.subtitle}</p></div>)}</div>;
}
