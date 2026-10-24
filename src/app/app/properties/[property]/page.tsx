import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });

export default async function PropertyShow({ params }: { params: Promise<{ property: string }> }) {
  const { property: id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "SUPERVISOR"]);
  if (!hasDatabaseConfiguration()) notFound();

  const property = await db.property.findFirst({
    where: { id, ...(session.organizationId ? { organizationId: session.organizationId } : {}), ...(session.role === "SUPERVISOR" ? { supervisorAssignments: { some: { userId: session.userId, active: true } } } : {}) },
    include: {
      buildings: { include: { units: true }, orderBy: { name: "asc" } },
      units: { include: { leases: true, listing: true }, orderBy: { unitNumber: "asc" } },
      supervisorAssignments: { where: { active: true }, include: { user: true } },
    },
  });
  if (!property) notFound();
  const protectedStates = new Set(["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"]);

  return (
    <>
      <PageHeader eyebrow="Property" title={property.name} description={`${property.address} · ${property.region}, ${property.district}`} action={<div className="flex gap-2"><Link href="/app/properties" className="rf-button rf-button-light">Back</Link>{session.role !== "SUPERVISOR" && <Link href={`/app/properties/${property.id}/edit`} className="rf-button rf-button-dark">Edit property</Link>}</div>} />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rf-card p-5"><p className="text-xs text-[var(--muted)]">Units</p><p className="mt-2 text-2xl font-semibold">{property.units.length}</p></div>
        <div className="rf-card p-5"><p className="text-xs text-[var(--muted)]">Occupied</p><p className="mt-2 text-2xl font-semibold">{property.units.filter((unit) => unit.leases.some((lease) => protectedStates.has(lease.status))).length}</p></div>
        <div className="rf-card p-5"><p className="text-xs text-[var(--muted)]">Published listings</p><p className="mt-2 text-2xl font-semibold">{property.units.filter((unit) => unit.listing?.status === "PUBLISHED").length}</p></div>
        <div className="rf-card p-5"><p className="text-xs text-[var(--muted)]">Supervisors</p><p className="mt-2 text-2xl font-semibold">{property.supervisorAssignments.length}</p></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="rf-card overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border)] p-5"><div><h2 className="font-semibold">Units</h2><p className="mt-1 text-xs text-[var(--muted)]">Rent and occupancy are derived from lease state.</p></div>{session.role !== "SUPERVISOR" && <Link href={`/app/properties/${property.id}/units/create`} className="rf-button rf-button-light">Add unit</Link>}</div>{property.units.length === 0 ? <p className="p-5 text-sm text-[var(--muted-strong)]">No units yet.</p> : property.units.map((unit) => { const occupied = unit.leases.some((lease) => protectedStates.has(lease.status)); return <div key={unit.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-[1fr_.6fr_auto] md:items-center"><div><p className="font-medium">{unit.unitNumber}</p><p className="mt-1 text-xs text-[var(--muted)]">{unit.type.replaceAll("_", " ")} · {unit.floor ? `Floor ${unit.floor}` : "Floor not set"}</p></div><div><p className="text-sm">{unit.currency} {unit.monthlyRent ? money.format(Number(unit.monthlyRent)) : "—"}</p><p className="mt-1 text-xs text-[var(--muted)]">per month</p></div><div className="flex items-center gap-2"><Status>{occupied ? "Occupied" : "Available"}</Status>{session.role !== "SUPERVISOR" && <Link href={`/app/properties/${property.id}/units/${unit.id}/edit`} className="text-sm font-medium">Edit</Link>}</div></div>; })}</section>
        <div className="space-y-6"><section className="rf-card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Buildings</h2>{session.role !== "SUPERVISOR" && <Link href={`/app/properties/${property.id}/buildings/create`} className="text-sm font-medium">Add →</Link>}</div><div className="mt-4 space-y-3">{property.buildings.length === 0 ? <p className="text-sm text-[var(--muted-strong)]">No buildings configured.</p> : property.buildings.map((building) => <div key={building.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">{building.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{building.floors ?? "—"} floors · {building.units.length} units</p></div>{session.role !== "SUPERVISOR" && <Link href={`/app/properties/${property.id}/buildings/${building.id}/edit`} className="text-sm">Edit</Link>}</div></div>)}</div></section><section className="rf-card p-5"><h2 className="font-semibold">Assigned supervisors</h2><div className="mt-4 space-y-3">{property.supervisorAssignments.length === 0 ? <p className="text-sm text-[var(--muted-strong)]">No active supervisor.</p> : property.supervisorAssignments.map((assignment) => <div key={assignment.id}><p className="font-medium">{assignment.user.name}</p><p className="text-xs text-[var(--muted)]">{assignment.user.phone ?? assignment.user.email}</p></div>)}</div></section></div>
      </div>
    </>
  );
}
