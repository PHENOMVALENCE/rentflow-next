import { db, hasDatabaseConfiguration } from "@/server/db";

const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export async function getListingsManagement(organizationId: string | null) {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "demo-1", title: "Mbezi Garden · B4", unit: "B4", property: "Mbezi Garden Residences", status: "Published", eligible: true, publishedAt: "Preview" },
      { id: "demo-2", title: "Kariakoo Trade Centre · S12", unit: "S12", property: "Kariakoo Trade Centre", status: "Eligible", eligible: true, publishedAt: "—" },
    ];
  }

  const rows = await db.propertyListing.findMany({
    where: organizationId ? { unit: { property: { organizationId } } } : undefined,
    include: { unit: { include: { property: true, leases: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((listing) => {
    const protectedLease = listing.unit.leases.some((lease) => ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status));
    return {
      id: listing.id,
      title: listing.title,
      unit: listing.unit.unitNumber,
      property: listing.unit.property.name,
      status: label(listing.status),
      eligible: !protectedLease,
      publishedAt: listing.publishedAt ? date.format(listing.publishedAt) : "—",
    };
  });
}

export async function getMaintenanceWorkflow(id: string, organizationId: string | null) {
  if (!hasDatabaseConfiguration()) return null;

  return db.maintenanceRequest.findFirst({
    where: {
      id,
      ...(organizationId ? { property: { organizationId } } : {}),
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
      updates: { orderBy: { createdAt: "asc" } },
    },
  });
}

export const maintenanceNextStates: Record<string, string[]> = {
  REPORTED: ["ACKNOWLEDGED"],
  ACKNOWLEDGED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["ACKNOWLEDGED", "ASSIGNED"],
};
