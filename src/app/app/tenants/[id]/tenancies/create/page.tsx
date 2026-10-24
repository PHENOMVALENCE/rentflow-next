import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { createLease } from "@/server/rentflow/lease-actions";

export default async function TenancyCreate({ params }: { params: Promise<{ id: string }> }) {
  const { id: tenantId } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!hasDatabaseConfiguration()) notFound();
  const tenant = await db.tenant.findFirst({ where: { id: tenantId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) } });
  if (!tenant) notFound();
  const units = await db.unit.findMany({
    where: {
      property: { ...(session.organizationId ? { organizationId: session.organizationId } : {}) },
      leases: { none: { status: { in: ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } },
    },
    include: { property: true },
    orderBy: [{ property: { name: "asc" } }, { unitNumber: "asc" }],
  });

  return <><PageHeader eyebrow="Tenancy" title={`Place ${tenant.name} on a unit`} description="Create the lease relationship and exact full-term payment obligation." action={<Link href={`/app/tenants/${tenant.id}`} className="rf-button rf-button-light">Cancel</Link>} /><form action={createLease} className="rf-card max-w-3xl space-y-5 p-6"><input type="hidden" name="tenantId" value={tenant.id} /><label className="block text-sm font-medium">Available unit<select name="unitId" required className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="">Select unit</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.property.name} · {unit.unitNumber}</option>)}</select></label><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Term<select name="termMonths" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="3">3 months</option><option value="6">6 months</option></select></label><label className="text-sm font-medium">Start date<input name="startDate" type="date" required className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label></div><p className="text-xs leading-5 text-[var(--muted)]">Creating a tenancy does not mark the unit as paid or active. RentFlow creates an awaiting-payment lease and requires exact verified settlement.</p><button className="rf-button rf-button-dark">Create tenancy</button></form></>;
}
