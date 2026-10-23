import { hasDatabaseConfiguration, db } from "@/server/db";
import {
  leases as demoLeases,
  maintenance as demoMaintenance,
  payments as demoPayments,
  properties as demoProperties,
} from "@/lib/demo-data";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export type CardRow = { id: string; title: string; subtitle: string; status: string; meta?: string };
export type TableRow = { id: string; primary: string; secondary: string; tertiary: string; quaternary: string };

export async function getPropertiesSection(organizationId: string | null) {
  if (!hasDatabaseConfiguration()) {
    return demoProperties.map((item) => ({
      id: item.name,
      primary: item.name,
      secondary: item.location,
      tertiary: `${item.occupied}/${item.units} occupied · ${item.listed} listed`,
      quaternary: item.supervisor,
    } satisfies TableRow));
  }

  const rows = await db.property.findMany({
    where: organizationId ? { organizationId, active: true } : { active: true },
    include: {
      units: { include: { leases: true, listing: true } },
      supervisorAssignments: { where: { active: true }, include: { user: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((property) => ({
    id: property.id,
    primary: property.name,
    secondary: [property.ward, property.district, property.region].filter(Boolean).join(", "),
    tertiary: `${property.units.filter((unit) => unit.leases.some((lease) => ["ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status))).length}/${property.units.length} occupied · ${property.units.filter((unit) => unit.listing?.status === "PUBLISHED").length} listed`,
    quaternary: property.supervisorAssignments[0]?.user.name ?? "—",
  }));
}

export async function getUnitsSection(organizationId: string | null): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "A2", title: "A2", subtitle: "Ocean View Apartments", status: "Occupied", meta: "Apartment" },
      { id: "B4", title: "B4", subtitle: "Mbezi Garden Residences", status: "Available", meta: "Apartment" },
      { id: "S12", title: "S12", subtitle: "Kariakoo Trade Centre", status: "Available", meta: "Shop" },
    ];
  }

  const rows = await db.unit.findMany({
    where: organizationId ? { property: { organizationId } } : undefined,
    include: { property: true, leases: { orderBy: { endDate: "desc" }, take: 1 } },
    orderBy: [{ property: { name: "asc" } }, { unitNumber: "asc" }],
  });

  return rows.map((unit) => {
    const current = unit.leases[0];
    const protectedOccupancy = current && ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(current.status);
    return {
      id: unit.id,
      title: unit.unitNumber,
      subtitle: unit.property.name,
      status: protectedOccupancy ? label(current.status) : "Available",
      meta: `${label(unit.type)} · TZS ${money.format(Number(unit.monthlyRent ?? 0))}/month`,
    };
  });
}

export async function getTenantsSection(organizationId: string | null): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "rehema", title: "Rehema K.", subtitle: "Ocean View · A2", status: "Active" },
      { id: "daniel", title: "Daniel M.", subtitle: "Mbezi Garden · B4", status: "Active" },
      { id: "grace", title: "Grace N.", subtitle: "Kariakoo · S12", status: "Grace" },
    ];
  }

  const rows = await db.tenant.findMany({
    where: organizationId ? { organizationId } : undefined,
    include: { leases: { include: { unit: { include: { property: true } } }, orderBy: { endDate: "desc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return rows.map((tenant) => {
    const lease = tenant.leases[0];
    return {
      id: tenant.id,
      title: tenant.name,
      subtitle: lease ? `${lease.unit.property.name} · ${lease.unit.unitNumber}` : tenant.phone,
      status: lease ? label(lease.status) : label(tenant.status),
      meta: tenant.email ?? tenant.phone,
    };
  });
}

export async function getLeasesSection(organizationId: string | null) {
  if (!hasDatabaseConfiguration()) return demoLeases.map((item, index) => ({ id: String(index), ...item }));

  const rows = await db.lease.findMany({
    where: organizationId ? { unit: { property: { organizationId } } } : undefined,
    include: { tenant: true, unit: { include: { property: true } } },
    orderBy: { endDate: "asc" },
  });

  return rows.map((lease) => ({
    id: lease.id,
    tenant: lease.tenant.name,
    unit: `${lease.unit.property.name} · ${lease.unit.unitNumber}`,
    status: label(lease.status),
    end: date.format(lease.endDate),
    amount: `TZS ${money.format(Number(lease.fullTermAmount))}`,
  }));
}

export async function getPaymentsSection(organizationId: string | null) {
  if (!hasDatabaseConfiguration()) return demoPayments.map((item) => ({ id: item.reference, ...item }));

  const rows = await db.paymentObligation.findMany({
    where: organizationId ? { lease: { unit: { property: { organizationId } } } } : undefined,
    include: { lease: { include: { tenant: true } }, transactions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((obligation) => ({
    id: obligation.id,
    reference: obligation.internalReference,
    tenant: obligation.lease.tenant.name,
    amount: `TZS ${money.format(Number(obligation.amount))}`,
    status: label(obligation.status),
    provider: obligation.transactions[0]?.provider ?? "Snippe",
  }));
}

export async function getMaintenanceSection(organizationId: string | null): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return demoMaintenance.map((item) => ({ id: item.title, title: item.title, subtitle: `${item.property} · ${item.tenant}`, status: item.status, meta: item.priority }));
  }

  const rows = await db.maintenanceRequest.findMany({
    where: organizationId ? { property: { organizationId } } : undefined,
    include: { property: true, tenant: true },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.property.name} · ${item.tenant.name}`,
    status: label(item.status),
    meta: label(item.priority),
  }));
}

export async function getSupervisorsSection(organizationId: string | null): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "asha", title: "Asha M.", subtitle: "Ocean View Apartments", status: "Active" },
      { id: "kelvin", title: "Kelvin J.", subtitle: "Mbezi Garden Residences", status: "Active" },
    ];
  }

  const rows = await db.supervisorAssignment.findMany({
    where: organizationId ? { property: { organizationId } } : undefined,
    include: { user: true, property: true },
    orderBy: { startsAt: "desc" },
  });

  return rows.map((assignment) => ({
    id: assignment.id,
    title: assignment.user.name,
    subtitle: assignment.property.name,
    status: assignment.active ? "Active" : "Inactive",
    meta: assignment.endsAt ? `Ended ${date.format(assignment.endsAt)}` : `Since ${date.format(assignment.startsAt)}`,
  }));
}

export async function getNoticesSection(organizationId: string | null): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "water", title: "Water maintenance notice", subtitle: "Ocean View Apartments", status: "Published", meta: "Info" },
      { id: "security", title: "Security access update", subtitle: "Mbezi Garden Residences", status: "Published", meta: "Warning" },
    ];
  }

  const rows = await db.safetyNotice.findMany({
    where: organizationId ? { organizationId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return rows.map((notice) => ({
    id: notice.id,
    title: notice.title,
    subtitle: notice.propertyId ? `Property notice · ${notice.propertyId.slice(0, 8)}` : "Organization-wide notice",
    status: notice.publishedAt ? "Published" : "Draft",
    meta: label(notice.severity),
  }));
}

export async function getReportsSection(organizationId: string | null) {
  if (!hasDatabaseConfiguration()) {
    return [
      ["Occupancy", "80%"], ["Collection", "91%"], ["Open maintenance", "5"],
      ["Renewal window", "4"], ["Grace", "2"], ["Listing inventory", "6"],
    ] as const;
  }

  const [units, occupied, obligations, paid, maintenance, renewal, grace, listings, auditCount] = await Promise.all([
    db.unit.count({ where: organizationId ? { property: { organizationId } } : undefined }),
    db.unit.count({ where: { ...(organizationId ? { property: { organizationId } } : {}), leases: { some: { status: { in: ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } } } }),
    db.paymentObligation.aggregate({ _sum: { amount: true }, where: organizationId ? { lease: { unit: { property: { organizationId } } } } : undefined }),
    db.paymentObligation.aggregate({ _sum: { amount: true }, where: { ...(organizationId ? { lease: { unit: { property: { organizationId } } } } : {}), status: "PAID" } }),
    db.maintenanceRequest.count({ where: { ...(organizationId ? { property: { organizationId } } : {}), status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    db.lease.count({ where: { ...(organizationId ? { unit: { property: { organizationId } } } : {}), status: "RENEWAL_WINDOW" } }),
    db.lease.count({ where: { ...(organizationId ? { unit: { property: { organizationId } } } : {}), status: "GRACE" } }),
    db.propertyListing.count({ where: { ...(organizationId ? { unit: { property: { organizationId } } } : {}), status: "PUBLISHED" } }),
    db.auditLog.count({ where: organizationId ? { organizationId } : undefined }),
  ]);

  const totalAmount = Number(obligations._sum.amount ?? 0);
  const paidAmount = Number(paid._sum.amount ?? 0);
  const occupancy = units ? Math.round((occupied / units) * 100) : 0;
  const collection = totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return [
    ["Occupancy", `${occupancy}%`],
    ["Collection", `${collection}%`],
    ["Open maintenance", String(maintenance)],
    ["Renewal window", String(renewal)],
    ["Grace", String(grace)],
    ["Listing inventory", String(listings)],
    ["Audit events", String(auditCount)],
  ] as const;
}
