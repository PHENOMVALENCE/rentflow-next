import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { updateProperty } from "@/server/rentflow/property-actions";

export default async function PropertyEdit({ params }: { params: Promise<{ property: string }> }) {
  const { property: id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!hasDatabaseConfiguration()) notFound();
  const property = await db.property.findFirst({ where: { id, ...(session.organizationId ? { organizationId: session.organizationId } : {}) } });
  if (!property) notFound();
  return <><PageHeader eyebrow="Property" title={`Edit ${property.name}`} description="Update authoritative property details." action={<Link href={`/app/properties/${property.id}`} className="rf-button rf-button-light">Cancel</Link>} /><form action={updateProperty} className="rf-card max-w-3xl space-y-5 p-6"><input type="hidden" name="propertyId" value={property.id} /><label className="block text-sm font-medium">Property name<input name="name" required defaultValue={property.name} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="block text-sm font-medium">Type<select name="type" defaultValue={property.type} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option><option value="MIXED_USE">Mixed use</option></select></label><label className="block text-sm font-medium">Address<input name="address" required defaultValue={property.address} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Region<input name="region" required defaultValue={property.region} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">District<input name="district" required defaultValue={property.district} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label></div><label className="block text-sm font-medium">Ward<input name="ward" defaultValue={property.ward ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><button className="rf-button rf-button-dark" type="submit">Save changes</button></form></>;
}
