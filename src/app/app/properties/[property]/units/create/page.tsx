import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { createUnit } from "@/server/rentflow/property-actions";

export default async function UnitCreate({ params }: { params: Promise<{ property: string }> }) {
  const { property: id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!hasDatabaseConfiguration()) notFound();
  const property = await db.property.findFirst({ where: { id, ...(session.organizationId ? { organizationId: session.organizationId } : {}) } });
  if (!property) notFound();
  return <><PageHeader eyebrow="Unit" title={`Add unit · ${property.name}`} description="Create a unit directly inside this property." action={<Link href={`/app/properties/${property.id}`} className="rf-button rf-button-light">Cancel</Link>} /><form action={createUnit} className="rf-card max-w-3xl space-y-5 p-6"><input type="hidden" name="propertyId" value={property.id} /><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Unit number<input name="unitNumber" required className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Unit type<select name="type" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="APARTMENT">Apartment</option><option value="SHOP">Shop</option><option value="OFFICE">Office</option><option value="STORE">Store</option><option value="OTHER">Other</option></select></label></div><label className="block text-sm font-medium">Monthly rent (TZS)<input name="monthlyRent" type="number" min="0" required className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><div className="grid gap-5 md:grid-cols-3"><label className="text-sm font-medium">Floor<input name="floor" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Bedrooms<input name="bedrooms" type="number" min="0" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Bathrooms<input name="bathrooms" type="number" min="0" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label></div><button className="rf-button rf-button-dark">Create unit</button></form></>;
}
