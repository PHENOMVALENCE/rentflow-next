import { db, hasDatabaseConfiguration } from "@/server/db";
import {
  dashboard as demoDashboard,
  leases as demoLeases,
  listings as demoListings,
  maintenance as demoMaintenance,
  properties as demoProperties,
  type Listing,
} from "@/lib/demo-data";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const titleCase = (value: string) => value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());

export async function getDashboardReadModel() {
  if (!hasDatabaseConfiguration()) {
    return { dashboard: demoDashboard, leases: demoLeases, maintenance: demoMaintenance, source: "demo" as const };
  }

  const [properties, units, occupied, listed, renewal, grace, paymentExceptions, maintenance, obligations, paid] = await Promise.all([
    db.property.count({ where: { active: true } }),
    db.unit.count(),
    db.unit.count({ where: { leases: { some: { status: { in: ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } } } }),
    db.propertyListing.count({ where: { status: "PUBLISHED" } }),
    db.lease.count({ where: { status: "RENEWAL_WINDOW" } }),
    db.lease.count({ where: { status: "GRACE" } }),
    db.paymentObligation.count({ where: { status: "EXCEPTION" } }),
    db.maintenanceRequest.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    db.paymentObligation.aggregate({ _sum: { amount: true }, where: { status: { in: ["PENDING", "PAID", "EXCEPTION"] } } }),
    db.paymentObligation.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
  ]);

  const totalAmount = Number(obligations._sum.amount ?? 0);
  const paidAmount = Number(paid._sum.amount ?? 0);
  const collection = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const leaseRows = await db.lease.findMany({
    where: { status: { in: ["RENEWAL_WINDOW", "GRACE", "AWAITING_PAYMENT", "ACTIVE"] } },
    include: { tenant: true, unit: { include: { property: true } } },
    orderBy: { endDate: "asc" },
    take: 6,
  });

  const maintenanceRows = await db.maintenanceRequest.findMany({
    where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
    include: { property: true, tenant: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return {
    dashboard: {
      properties,
      units,
      occupied,
      listed,
      renewal,
      grace,
      paymentExceptions,
      maintenance,
      revenue: `TZS ${money.format(paidAmount)}`,
      collection: `${collection}%`,
    },
    leases: leaseRows.map((lease) => ({
      tenant: lease.tenant.name,
      unit: `${lease.unit.property.name} · ${lease.unit.unitNumber}`,
      status: titleCase(lease.status),
      end: date.format(lease.endDate),
      amount: `TZS ${money.format(Number(lease.fullTermAmount))}`,
    })),
    maintenance: maintenanceRows.map((item) => ({
      title: item.title,
      property: item.property.name,
      tenant: item.tenant.name,
      priority: titleCase(item.priority),
      status: titleCase(item.status),
    })),
    source: "database" as const,
  };
}

export async function getPublicListings(): Promise<Listing[]> {
  if (!hasDatabaseConfiguration()) return demoListings;

  const rows = await db.propertyListing.findMany({
    where: { status: "PUBLISHED", unit: { listingEnabled: true } },
    include: { unit: { include: { property: true, leases: { orderBy: { endDate: "desc" }, take: 1 } } } },
    orderBy: { publishedAt: "desc" },
  });

  return rows.map((listing) => ({
    id: listing.id,
    title: listing.title,
    location: [listing.unit.property.ward, listing.unit.property.district, listing.unit.property.region].filter(Boolean).join(", "),
    type: titleCase(listing.unit.property.type),
    unit: `${titleCase(listing.unit.type)} ${listing.unit.unitNumber}`,
    monthly: Number(listing.unit.monthlyRent ?? 0),
    term: listing.unit.leases[0]?.termMonths ?? 3,
    bedrooms: listing.unit.bedrooms ?? 0,
    baths: listing.unit.bathrooms ?? 0,
    status: "Available",
    description: listing.description,
    features: [],
  }));
}

export async function getPublicListing(id: string) {
  const listings = await getPublicListings();
  return listings.find((listing) => listing.id === id) ?? null;
}

export async function getPropertyRows() {
  if (!hasDatabaseConfiguration()) return demoProperties;

  const rows = await db.property.findMany({
    where: { active: true },
    include: {
      units: { include: { leases: true, listing: true } },
      supervisorAssignments: { where: { active: true }, include: { user: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((property) => ({
    name: property.name,
    location: [property.ward, property.district].filter(Boolean).join(", "),
    units: property.units.length,
    occupied: property.units.filter((unit) => unit.leases.some((lease) => ["ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status))).length,
    listed: property.units.filter((unit) => unit.listing?.status === "PUBLISHED").length,
    supervisor: property.supervisorAssignments[0]?.user.name ?? "—",
  }));
}
