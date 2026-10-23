import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
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
  notices: "Publish operational notices and manage property communication.",
  reports: "Monitor authoritative operational metrics and audit evidence.",
  settings: "Organization and platform preferences.",
};
const singular: Partial<Record<SectionName, string>> = { properties: "property", units: "unit", listings: "listing", tenants: "tenant", leases: "lease", maintenance: "request", notices: "notice" };

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section: rawSection } = await params;
  if (!allowed.includes(rawSection as SectionName)) notFound();
  const section = rawSection as SectionName;
  const session = await requireSession();

  return (
    <>
      <PageHeader eyebrow="Operations" title={titles[section]} description={descriptions[section]} action={singular[section] ? <Link href={`/app/${section}/new`} className="rf-button rf-button-dark">New {singular[section]}</Link> : undefined} />
      {await renderSection(section, session.organizationId)}
    </>
  );
}

async function renderSection(section: SectionName, organizationId: string | null) {
  if (section === "properties") {
    const rows = await getPropertiesSection(organizationId);
    return <div className="rf-card overflow-hidden"><div className="rf-table-head"><span>Property</span><span>Location</span><span>Occupancy</span><span>Supervisor</span></div>{rows.map((row) => <div className="rf-table-row" key={row.id}><div><p className="font-medium">{row.primary}</p></div><span>{row.secondary}</span><span>{row.tertiary}</span><span>{row.quaternary}</span></div>)}</div>;
  }
  if (section === "units") return <Cards rows={await getUnitsSection(organizationId)} />;
  if (section === "tenants") return <Cards rows={await getTenantsSection(organizationId)} />;
  if (section === "supervisors") return <Cards rows={await getSupervisorsSection(organizationId)} />;
  if (section === "notices") return <Cards rows={await getNoticesSection(organizationId)} />;

  if (section === "maintenance") {
    const rows = await getMaintenanceSection(organizationId);
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <Link href={`/app/maintenance/${row.id}`} className="rf-card p-5" key={row.id}><div className="flex items-center justify-between gap-3"><Status>{row.status}</Status>{row.meta && <span className="text-xs text-[var(--muted)]">{row.meta}</span>}</div><h3 className="mt-4 font-semibold">{row.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{row.subtitle}</p><p className="mt-4 text-xs font-medium">Open workflow →</p></Link>)}</div>;
  }

  if (section === "leases") {
    const rows = await getLeasesSection(organizationId);
    return <div className="rf-card">{rows.map((row) => <div key={row.id} className="flex justify-between gap-4 border-b border-[var(--border)] p-5 last:border-b-0"><div><p className="font-medium">{row.tenant}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.unit} · {row.amount}</p></div><div className="text-right"><Status>{row.status}</Status><p className="mt-2 text-xs">{row.end}</p></div></div>)}</div>;
  }

  if (section === "payments") {
    const rows = await getPaymentsSection(organizationId);
    return <div className="rf-card">{rows.map((row) => <Link href={`/app/payments/${row.id}`} key={row.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-4 md:items-center hover:bg-slate-50"><div><p className="font-mono text-xs">{row.reference}</p><p className="mt-1 font-medium">{row.tenant}</p></div><span>{row.amount}</span><span>{row.provider}</span><span className="md:text-right"><Status>{row.status}</Status></span></Link>)}</div>;
  }

  if (section === "listings") {
    const rows = await getListingsManagement(organizationId);
    return <div className="rf-card overflow-hidden">{rows.map((row) => <div key={row.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1.4fr_.6fr_.7fr_auto] lg:items-center"><div><p className="font-medium">{row.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.property} · {row.unit}</p></div><Status>{row.status}</Status><p className="text-xs text-[var(--muted)]">Published: {row.publishedAt}</p><div className="flex gap-2">{row.status === "Published" ? <form action={pauseListing}><input type="hidden" name="listingId" value={row.id} /><button className="rf-button rf-button-light" type="submit">Pause</button></form> : <form action={publishListing}><input type="hidden" name="listingId" value={row.id} /><button className="rf-button rf-button-dark" type="submit" disabled={!row.eligible}>Publish</button></form>}</div></div>)}</div>;
  }

  if (section === "reports") {
    const rows = await getReportsSection(organizationId);
    return <div className="grid gap-4 md:grid-cols-3">{rows.map(([name, value]) => <div className="rf-card p-6" key={name}><p className="text-sm text-[var(--muted)]">{name}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>;
  }

  return <div className="rf-card max-w-2xl p-6"><h2 className="font-semibold">Organization settings</h2><p className="mt-2 text-sm text-[var(--muted-strong)]">Workspace identity, authentication and provider settings are controlled server-side. Sensitive provider secrets are configured only through runtime environment variables.</p></div>;
}

function Cards({ rows }: { rows: CardRow[] }) {
  if (rows.length === 0) return <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No records found.</div>;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <div className="rf-card p-5" key={row.id}><div className="flex items-center justify-between gap-3"><Status>{row.status}</Status>{row.meta && <span className="text-xs text-[var(--muted)]">{row.meta}</span>}</div><h3 className="mt-4 font-semibold">{row.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{row.subtitle}</p></div>)}</div>;
}
