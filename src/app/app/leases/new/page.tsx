import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { createLeaseWithListingGuard } from "@/server/rentflow/lease-creation";

export default async function NewLeasePage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Leases" title="Create lease" description="Lease creation requires the production database." action={<Link href="/app/leases" className="rf-button rf-button-light">Back</Link>} />
        <div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">Preview mode does not create authoritative leases or payment obligations.</div>
      </>
    );
  }

  if (!session.organizationId) throw new Error("An organization is required to create leases.");

  const [units, tenants] = await Promise.all([
    db.unit.findMany({
      where: {
        property: { organizationId: session.organizationId },
        leases: { none: { status: { in: ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } },
      },
      include: { property: true },
      orderBy: [{ property: { name: "asc" } }, { unitNumber: "asc" }],
    }),
    db.tenant.findMany({ where: { organizationId: session.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Leases"
        title="Create lease"
        description="Creates a protected 3/6-month lease and exact full-term payment obligation in one transaction."
        action={<Link href="/app/leases" className="rf-button rf-button-light">Back</Link>}
      />

      <form action={createLeaseWithListingGuard} className="rf-card max-w-3xl space-y-5 p-6">
        <label className="block text-sm font-medium">Available unit
          <select name="unitId" required className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3">
            <option value="">Select unit</option>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.property.name} · {unit.unitNumber} · TZS {Number(unit.monthlyRent ?? 0).toLocaleString("en-TZ")}/month</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Tenant
          <select name="tenantId" required className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3">
            <option value="">Select tenant</option>
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} · {tenant.phone}</option>)}
          </select>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">Initial term
            <select name="termMonths" required className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="3">3 months</option><option value="6">6 months</option></select>
          </label>
          <label className="block text-sm font-medium">Start date<input name="startDate" required type="date" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">Creating the lease immediately blocks any existing public listing for this unit. The lease remains <strong>awaiting payment</strong> until an exact verified provider callback settles its full-term obligation.</div>
        <button type="submit" className="rf-button rf-button-dark">Create lease & obligation</button>
      </form>
    </>
  );
}
