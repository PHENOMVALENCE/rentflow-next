import type { SessionPayload } from "@/server/auth/session";
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
const protectedStates = ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;

export type CardRow = { id: string; title: string; subtitle: string; status: string; meta?: string };
export type TableRow = { id: string; primary: string; secondary: string; tertiary: string; quaternary: string };

type ReadScope = {
  organizationId: string | null;
  propertyIds?: string[];
  tenantId?: string;
};

export async function resolveScope(session: SessionPayload): Promise<ReadScope> {
  if (!hasDatabaseConfiguration()) return { organizationId: session.organizationId };

  if (session.role === "SUPERVISOR") {
    const assignments = await db.supervisorAssignment.findMany({
      where: { userId: session.userId, active: true },
      select: { propertyId: true },
    });
    return { organizationId: session.organizationId, propertyIds: assignments.map((item) => item.propertyId) };
  }

  if (session.role === "TENANT") {
    const tenant = await db.tenant.findFirst({
      where: { userId: session.userId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) },
      include: {
        leases: {
          where: { status: { in: [...protectedStates] } },
          select: { unit: { select: { propertyId: true } } },
        },
      },
    });
    return {
      organizationId: session.organizationId,
      tenantId: tenant?.id,
      propertyIds: tenant ? [...new Set(tenant.leases.map((lease) => lease.unit.propertyId))] : [],
    };
  }

  return { organizationId: session.organizationId };
}

export async function getPropertiesSection(session: SessionPayload) {
  if (!hasDatabaseConfiguration()) {
    return demoProperties.map((item) => ({
      id: item.name,
      primary: item.name,
      secondary: item.location,
      tertiary: `${item.occupied}/${item.units} occupied · ${item.listed} listed`,
      quaternary: item.supervisor,
    } satisfies TableRow));
  }

  const scope = await resolveScope(session);
  const rows = await db.property.findMany({
    where: {
      active: true,
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
      ...(scope.propertyIds ? { id: { in: scope.propertyIds } } : {}),
    },
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

export async function getUnitsSection(session: SessionPayload): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "A2", title: "A2", subtitle: "Ocean View Apartments", status: "Occupied", meta: "Apartment" },
      { id: "B4", title: "B4", subtitle: "Mbezi Garden Residences", status: "Available", meta: "Apartment" },
      { id: "S12", title: "S12", subtitle: "Kariakoo Trade Centre", status: "Available", meta: "Shop" },
    ];
  }

  const scope = await resolveScope(session);
  const rows = await db.unit.findMany({
    where: {
      property: {
        ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
        ...(scope.propertyIds ? { id: { in: scope.propertyIds } } : {}),
      },
      ...(scope.tenantId ? { leases: { some: { tenantId: scope.tenantId, status: { in: [...protectedStates] } } } } : {}),
    },
    include: { property: true, leases: { orderBy: { endDate: "desc" }, take: 1 } },
    orderBy: [{ property: { name: "asc" } }, { unitNumber: "asc" }],
  });

  return rows.map((unit) => {
    const current = unit.leases[0];
    const protectedOccupancy = current && protectedStates.includes(current.status as (typeof protectedStates)[number]);
    return {
      id: unit.id,
      title: unit.unitNumber,
      subtitle: unit.property.name,
      status: protectedOccupancy ? label(current.status) : "Available",
      meta: `${label(unit.type)} · TZS ${money.format(Number(unit.monthlyRent ?? 0))}/month`,
    };
  });
}

export async function getTenantsSection(session: SessionPayload): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "rehema", title: "Rehema K.", subtitle: "Ocean View · A2", status: "Active" },
      { id: "daniel", title: "Daniel M.", subtitle: "Mbezi Garden · B4", status: "Active" },
      { id: "grace", title: "Grace N.", subtitle: "Kariakoo · S12", status: "Grace" },
    ];
  }

  const scope = await resolveScope(session);
  const rows = await db.tenant.findMany({
    where: scope.tenantId
      ? { id: scope.tenantId }
      : {
          ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
          ...(scope.propertyIds
            ? { leases: { some: { unit: { propertyId: { in: scope.propertyIds } }, status: { in: [...protectedStates] } } } }
            : {}),
        },
    include: {
      leases: {
        where: scope.propertyIds ? { unit: { propertyId: { in: scope.propertyIds } } } : undefined,
        include: { unit: { include: { property: true } } },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
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

export async function getLeasesSection(session: SessionPayload) {
  if (!hasDatabaseConfiguration()) return demoLeases.map((item, index) => ({ id: String(index), ...item }));
  const scope = await resolveScope(session);

  const rows = await db.lease.findMany({
    where: {
      ...(scope.tenantId ? { tenantId: scope.tenantId } : {}),
      ...(!scope.tenantId && scope.propertyIds ? { unit: { propertyId: { in: scope.propertyIds } } } : {}),
      ...(!scope.tenantId && !scope.propertyIds && scope.organizationId ? { unit: { property: { organizationId: scope.organizationId } } } : {}),
    },
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

export async function getPaymentsSection(session: SessionPayload) {
  if (!hasDatabaseConfiguration()) return demoPayments.map((item) => ({ id: item.reference, ...item }));
  const scope = await resolveScope(session);

  const rows = await db.paymentObligation.findMany({
    where: {
      lease: scope.tenantId
        ? { tenantId: scope.tenantId }
        : scope.propertyIds
          ? { unit: { propertyId: { in: scope.propertyIds } } }
          : scope.organizationId
            ? { unit: { property: { organizationId: scope.organizationId } } }
            : {},
    },
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

export async function getMaintenanceSection(session: SessionPayload): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return demoMaintenance.map((item) => ({ id: item.title, title: item.title, subtitle: `${item.property} · ${item.tenant}`, status: item.status, meta: item.priority }));
  }

  const scope = await resolveScope(session);
  const rows = await db.maintenanceRequest.findMany({
    where: {
      ...(scope.tenantId ? { tenantId: scope.tenantId } : {}),
      ...(!scope.tenantId && scope.propertyIds ? { propertyId: { in: scope.propertyIds } } : {}),
      ...(!scope.tenantId && !scope.propertyIds && scope.organizationId ? { property: { organizationId: scope.organizationId } } : {}),
    },
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

export async function getSupervisorsSection(session: SessionPayload): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "asha", title: "Asha M.", subtitle: "Ocean View Apartments", status: "Active" },
      { id: "kelvin", title: "Kelvin J.", subtitle: "Mbezi Garden Residences", status: "Active" },
    ];
  }

  const scope = await resolveScope(session);
  const rows = await db.supervisorAssignment.findMany({
    where: {
      ...(scope.organizationId ? { property: { organizationId: scope.organizationId } } : {}),
      ...(scope.propertyIds ? { propertyId: { in: scope.propertyIds } } : {}),
    },
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

export async function getNoticesSection(session: SessionPayload): Promise<CardRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "water", title: "Water maintenance notice", subtitle: "Ocean View Apartments", status: "Published", meta: "Info" },
      { id: "security", title: "Security access update", subtitle: "Mbezi Garden Residences", status: "Published", meta: "Warning" },
    ];
  }

  const scope = await resolveScope(session);
  const rows = await db.safetyNotice.findMany({
    where: {
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
      ...(scope.propertyIds
        ? { OR: [{ propertyId: null }, { propertyId: { in: scope.propertyIds } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((notice) => ({
    id: notice.id,
    title: notice.title,
    subtitle: notice.propertyId ? "Property notice" : "Organization-wide notice",
    status: notice.publishedAt ? "Published" : "Draft",
    meta: label(notice.severity),
  }));
}

export async function getReportsSection(session: SessionPayload) {
  if (!hasDatabaseConfiguration()) {
    return [
      ["Occupancy", "80%"], ["Collection", "91%"], ["Open maintenance", "5"],
      ["Renewal window", "4"], ["Grace", "2"], ["Listing inventory", "6"],
    ] as const;
  }

  const scope = await resolveScope(session);
  const propertyWhere = {
    ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
    ...(scope.propertyIds ? { id: { in: scope.propertyIds } } : {}),
  };
  const unitWhere = { property: propertyWhere };
  const leaseWhere = { unit: unitWhere };

  const [units, occupied, obligations, paid, maintenance, renewal, grace, listings, auditCount] = await Promise.all([
    db.unit.count({ where: unitWhere }),
    db.unit.count({ where: { ...unitWhere, leases: { some: { status: { in: ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } } } }),
    db.paymentObligation.aggregate({ _sum: { amount: true }, where: { lease: leaseWhere } }),
    db.paymentObligation.aggregate({ _sum: { amount: true }, where: { lease: leaseWhere, status: "PAID" } }),
    db.maintenanceRequest.count({ where: { property: propertyWhere, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    db.lease.count({ where: { ...leaseWhere, status: "RENEWAL_WINDOW" } }),
    db.lease.count({ where: { ...leaseWhere, status: "GRACE" } }),
    db.propertyListing.count({ where: { unit: unitWhere, status: "PUBLISHED" } }),
    db.auditLog.count({ where: scope.organizationId ? { organizationId: scope.organizationId } : undefined }),
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
