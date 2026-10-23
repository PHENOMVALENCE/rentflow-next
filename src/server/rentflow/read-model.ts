import type { SessionPayload } from "@/server/auth/session";
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
const protectedStates = ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;

function emptyDashboard() {
  return {
    dashboard: {
      properties: 0,
      units: 0,
      occupied: 0,
      listed: 0,
      renewal: 0,
      grace: 0,
      paymentExceptions: 0,
      maintenance: 0,
      revenue: "TZS 0",
      collection: "0%",
    },
    leases: [],
    maintenance: [],
    source: "database" as const,
  };
}

export async function getDashboardReadModel(session: SessionPayload) {
  if (!hasDatabaseConfiguration()) {
    return { dashboard: demoDashboard, leases: demoLeases, maintenance: demoMaintenance, source: "demo" as const };
  }

  if (session.role === "TENANT") return getTenantDashboard(session);
  if (session.role === "SUPERVISOR") return getSupervisorDashboard(session);
  return getPortfolioDashboard(session.organizationId);
}

async function getPortfolioDashboard(organizationId: string | null) {
  const propertyScope = organizationId ? { organizationId } : {};
  const unitScope = organizationId ? { property: { organizationId } } : {};
  const leaseScope = organizationId ? { unit: { property: { organizationId } } } : {};

  const [properties, units, occupied, listed, renewal, grace, paymentExceptions, maintenance, obligations, paid] = await Promise.all([
    db.property.count({ where: { active: true, ...propertyScope } }),
    db.unit.count({ where: unitScope }),
    db.unit.count({ where: { ...unitScope, leases: { some: { status: { in: ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } } } }),
    db.propertyListing.count({ where: { status: "PUBLISHED", unit: unitScope } }),
    db.lease.count({ where: { ...leaseScope, status: "RENEWAL_WINDOW" } }),
    db.lease.count({ where: { ...leaseScope, status: "GRACE" } }),
    db.paymentObligation.count({ where: { status: "EXCEPTION", lease: leaseScope } }),
    db.maintenanceRequest.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] }, ...(organizationId ? { property: { organizationId } } : {}) } }),
    db.paymentObligation.aggregate({ _sum: { amount: true }, where: { status: { in: ["PENDING", "PAID", "EXCEPTION"] }, lease: leaseScope } }),
    db.paymentObligation.aggregate({ _sum: { amount: true }, where: { status: "PAID", lease: leaseScope } }),
  ]);

  const totalAmount = Number(obligations._sum.amount ?? 0);
  const paidAmount = Number(paid._sum.amount ?? 0);
  const collection = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const leaseRows = await db.lease.findMany({
    where: { ...leaseScope, status: { in: [...protectedStates] } },
    include: { tenant: true, unit: { include: { property: true } } },
    orderBy: { endDate: "asc" },
    take: 6,
  });

  const maintenanceRows = await db.maintenanceRequest.findMany({
    where: { status: { notIn: ["RESOLVED", "CLOSED"] }, ...(organizationId ? { property: { organizationId } } : {}) },
    include: { property: true, tenant: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return mapDashboard({ properties, units, occupied, listed, renewal, grace, paymentExceptions, maintenance, totalAmount, paidAmount, collection, leaseRows, maintenanceRows });
}

async function getSupervisorDashboard(session: SessionPayload) {
  const assignments = await db.supervisorAssignment.findMany({
    where: { userId: session.userId, active: true },
    select: { propertyId: true },
  });
  const propertyIds = assignments.map((assignment) => assignment.propertyId);
  if (propertyIds.length === 0) return emptyDashboard();

  const [units, occupied, listed, renewal, grace, maintenance] = await Promise.all([
    db.unit.count({ where: { propertyId: { in: propertyIds } } }),
    db.unit.count({ where: { propertyId: { in: propertyIds }, leases: { some: { status: { in: ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } } } }),
    db.propertyListing.count({ where: { status: "PUBLISHED", unit: { propertyId: { in: propertyIds } } } }),
    db.lease.count({ where: { unit: { propertyId: { in: propertyIds } }, status: "RENEWAL_WINDOW" } }),
    db.lease.count({ where: { unit: { propertyId: { in: propertyIds } }, status: "GRACE" } }),
    db.maintenanceRequest.count({ where: { propertyId: { in: propertyIds }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
  ]);

  const leaseRows = await db.lease.findMany({
    where: { unit: { propertyId: { in: propertyIds } }, status: { in: [...protectedStates] } },
    include: { tenant: true, unit: { include: { property: true } } },
    orderBy: { endDate: "asc" },
    take: 6,
  });
  const maintenanceRows = await db.maintenanceRequest.findMany({
    where: { propertyId: { in: propertyIds }, status: { notIn: ["RESOLVED", "CLOSED"] } },
    include: { property: true, tenant: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return mapDashboard({
    properties: propertyIds.length,
    units,
    occupied,
    listed,
    renewal,
    grace,
    paymentExceptions: 0,
    maintenance,
    totalAmount: 0,
    paidAmount: 0,
    collection: 0,
    leaseRows,
    maintenanceRows,
  });
}

async function getTenantDashboard(session: SessionPayload) {
  const tenant = await db.tenant.findFirst({
    where: { userId: session.userId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) },
  });
  if (!tenant) return emptyDashboard();

  const leaseRows = await db.lease.findMany({
    where: { tenantId: tenant.id, status: { in: [...protectedStates, "EXPIRED"] } },
    include: { tenant: true, unit: { include: { property: true } } },
    orderBy: { endDate: "asc" },
    take: 6,
  });
  const maintenanceRows = await db.maintenanceRequest.findMany({
    where: { tenantId: tenant.id },
    include: { property: true, tenant: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const obligations = await db.paymentObligation.findMany({
    where: { lease: { tenantId: tenant.id } },
    select: { amount: true, status: true },
  });
  const totalAmount = obligations.reduce((sum, item) => sum + Number(item.amount), 0);
  const paidAmount = obligations.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.amount), 0);
  const activeLeases = leaseRows.filter((lease) => protectedStates.includes(lease.status as (typeof protectedStates)[number]));
  const propertyIds = new Set(activeLeases.map((lease) => lease.unit.propertyId));
  const unitIds = new Set(activeLeases.map((lease) => lease.unitId));

  return mapDashboard({
    properties: propertyIds.size,
    units: unitIds.size,
    occupied: unitIds.size,
    listed: 0,
    renewal: leaseRows.filter((lease) => lease.status === "RENEWAL_WINDOW").length,
    grace: leaseRows.filter((lease) => lease.status === "GRACE").length,
    paymentExceptions: obligations.filter((item) => item.status === "EXCEPTION").length,
    maintenance: maintenanceRows.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length,
    totalAmount,
    paidAmount,
    collection: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    leaseRows,
    maintenanceRows,
  });
}

type DashboardInput = {
  properties: number;
  units: number;
  occupied: number;
  listed: number;
  renewal: number;
  grace: number;
  paymentExceptions: number;
  maintenance: number;
  totalAmount: number;
  paidAmount: number;
  collection: number;
  leaseRows: Array<{
    tenant: { name: string };
    unit: { unitNumber: string; property: { name: string } };
    status: string;
    endDate: Date;
    fullTermAmount: unknown;
  }>;
  maintenanceRows: Array<{
    title: string;
    priority: string;
    status: string;
    property: { name: string };
    tenant: { name: string };
  }>;
};

function mapDashboard(input: DashboardInput) {
  return {
    dashboard: {
      properties: input.properties,
      units: input.units,
      occupied: input.occupied,
      listed: input.listed,
      renewal: input.renewal,
      grace: input.grace,
      paymentExceptions: input.paymentExceptions,
      maintenance: input.maintenance,
      revenue: `TZS ${money.format(input.paidAmount)}`,
      collection: `${input.collection}%`,
    },
    leases: input.leaseRows.map((lease) => ({
      tenant: lease.tenant.name,
      unit: `${lease.unit.property.name} · ${lease.unit.unitNumber}`,
      status: titleCase(lease.status),
      end: date.format(lease.endDate),
      amount: `TZS ${money.format(Number(lease.fullTermAmount))}`,
    })),
    maintenance: input.maintenanceRows.map((item) => ({
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
