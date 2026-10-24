import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { updateBuilding } from "@/server/rentflow/property-actions";

export default async function BuildingEdit({ params }: { params: Promise<{ property: string; building: string }> }) {
  const { property: propertyId, building: buildingId } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!hasDatabaseConfiguration()) notFound();
  const building = await db.building.findFirst({ where: { id: buildingId, propertyId, property: { ...(session.organizationId ? { organizationId: session.organizationId } : {}) } }, include: { property: true } });
  if (!building) notFound();
  return <><PageHeader eyebrow="Building" title={`Edit ${building.name}`} description={building.property.name} action={<Link href={`/app/properties/${propertyId}`} className="rf-button rf-button-light">Cancel</Link>} /><form action={updateBuilding} className="rf-card max-w-2xl space-y-5 p-6"><input type="hidden" name="buildingId" value={building.id} /><input type="hidden" name="propertyId" value={propertyId} /><label className="block text-sm font-medium">Building name<input name="name" required maxLength={160} defaultValue={building.name} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="block text-sm font-medium">Floors<input name="floors" type="number" min="1" max="200" defaultValue={building.floors ?? undefined} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><button className="rf-button rf-button-dark">Save building</button></form></>;
}
