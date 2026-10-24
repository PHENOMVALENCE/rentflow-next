import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { updateUnit } from "@/server/rentflow/property-actions";

export default async function UnitEdit({ params }: { params: Promise<{ property: string; unit: string }> }) {
  const { property: propertyId, unit: unitId } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!hasDatabaseConfiguration()) notFound();
  const unit = await db.unit.findFirst({ where: { id: unitId, propertyId, property: { ...(session.organizationId ? { organizationId: session.organizationId } : {}) } }, include: { property: true } });
  if (!unit) notFound();
  return <><PageHeader eyebrow="Unit" title={`Edit ${unit.unitNumber}`} description={unit.property.name} action={<Link href={`/app/properties/${propertyId}`} className="rf-button rf-button-light">Cancel</Link>} /><form action={updateUnit} className="rf-card max-w-3xl space-y-5 p-6"><input type="hidden" name="unitId" value={unit.id} /><input type="hidden" name="propertyId" value={propertyId} /><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Unit number<input name="unitNumber" required defaultValue={unit.unitNumber} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Unit type<select name="type" defaultValue={unit.type} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="APARTMENT">Apartment</option><option value="SHOP">Shop</option><option value="OFFICE">Office</option><option value="STORE">Store</option><option value="OTHER">Other</option></select></label></div><label className="block text-sm font-medium">Monthly rent (TZS)<input name="monthlyRent" type="number" min="0" required defaultValue={unit.monthlyRent ? Number(unit.monthlyRent) : 0} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><div className="grid gap-5 md:grid-cols-3"><label className="text-sm font-medium">Floor<input name="floor" defaultValue={unit.floor ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Bedrooms<input name="bedrooms" type="number" min="0" defaultValue={unit.bedrooms ?? undefined} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Bathrooms<input name="bathrooms" type="number" min="0" defaultValue={unit.bathrooms ?? undefined} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label></div><button className="rf-button rf-button-dark">Save unit</button></form></>;
}
