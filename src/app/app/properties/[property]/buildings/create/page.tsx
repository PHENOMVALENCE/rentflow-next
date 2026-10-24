import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { createBuilding } from "@/server/rentflow/property-actions";

export default async function BuildingCreate({ params }: { params: Promise<{ property: string }> }) {
  const { property: propertyId } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!hasDatabaseConfiguration()) notFound();
  const property = await db.property.findFirst({ where: { id: propertyId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) } });
  if (!property) notFound();
  return <><PageHeader eyebrow="Building" title={`Add building · ${property.name}`} description="Group units into a named building within this property." action={<Link href={`/app/properties/${property.id}`} className="rf-button rf-button-light">Cancel</Link>} /><form action={createBuilding} className="rf-card max-w-2xl space-y-5 p-6"><input type="hidden" name="propertyId" value={property.id} /><label className="block text-sm font-medium">Building name<input name="name" required maxLength={160} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="block text-sm font-medium">Floors<input name="floors" type="number" min="1" max="200" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><button className="rf-button rf-button-dark">Create building</button></form></>;
}
