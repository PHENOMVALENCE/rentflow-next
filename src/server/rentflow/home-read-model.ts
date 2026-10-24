import { leaseCountdown, leaseRail, tenantNextStep, type JourneyLeaseStatus, type JourneyObligationStatus } from "@/domain/tenant-journey";
import type { SessionPayload } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

/**
 * Role home read models (Laravel `home-tenant`, `home-supervisor`, `home-pending`).
 * Every query is scoped to the session user; nothing here is shared across tenants.
 */

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const money = (amount: number, currency = "TZS") => `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)}`;
const titleCase = (value: string) => value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
const OPEN_MAINTENANCE = { notIn: ["RESOLVED", "CLOSED"] as ("RESOLVED" | "CLOSED")[] };
const CURRENT_LEASE = ["DRAFT", "AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;

export type PendingHome = { kind: "pending"; role: "TENANT" | "SUPERVISOR"; canRequestAttachment: boolean };

export type TenantHome = {
  kind: "tenant";
  firstName: string;
  lease: {
    id: string;
    property: string;
    propertyId: string;
    unit: string;
    address: string;
    status: string;
    rawStatus: JourneyLeaseStatus;
    termMonths: number;
    start: string;
    end: string;
    amount: string;
    payment: string;
  };
  countdown: ReturnType<typeof leaseCountdown>;
  rail: { progress: number; stops: { label: string; date: string; state: "done" | "current" | "upcoming" }[] };
  next: ReturnType<typeof tenantNextStep>;
  maintenance: { id: string; title: string; reported: string; status: string }[];
  notices: { id: string; title: string; published: string; severity: string }[];
  supervisor: { name: string; phone: string | null } | null;
};

export type SupervisorHome = {
  kind: "supervisor";
  firstName: string;
  properties: { id: string; name: string; location: string; units: number; occupied: number; openMaintenance: number }[];
  maintenance: { id: string; title: string; property: string; status: string; priority: string }[];
  renewals: { id: string; tenant: string; unit: string; status: string; end: string }[];
};

function railView(start: Date, end: Date, now: Date): TenantHome["rail"] {
  const rail = leaseRail(start, end, now);
  return { progress: rail.progress, stops: rail.stops.map((stop) => ({ ...stop, date: dateFmt.format(stop.date) })) };
}

export type RoleHome = PendingHome | TenantHome | SupervisorHome;

export async function getRoleHome(session: SessionPayload): Promise<RoleHome | null> {
  if (session.role !== "TENANT" && session.role !== "SUPERVISOR") return null;
  if (!hasDatabaseConfiguration()) return session.role === "TENANT" ? demoTenantHome() : demoSupervisorHome();
  return session.role === "TENANT" ? tenantHome(session) : supervisorHome(session);
}

async function firstNameOf(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  return (user?.name ?? "").trim().split(/\s+/)[0] ?? "";
}

async function tenantHome(session: SessionPayload): Promise<RoleHome> {
  const tenant = await db.tenant.findFirst({
    where: { userId: session.userId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) },
    select: { id: true, organizationId: true },
  });
  if (!tenant) return { kind: "pending", role: "TENANT", canRequestAttachment: true };

  const lease = await db.lease.findFirst({
    where: { tenantId: tenant.id, status: { in: [...CURRENT_LEASE] } },
    include: { obligation: { select: { status: true } }, unit: { include: { property: true } } },
    orderBy: { endDate: "desc" },
  });
  if (!lease) return { kind: "pending", role: "TENANT", canRequestAttachment: false };

  const property = lease.unit.property;
  const now = new Date();
  const [firstName, maintenance, notices, assignment] = await Promise.all([
    firstNameOf(session.userId),
    db.maintenanceRequest.findMany({ where: { tenantId: tenant.id, status: OPEN_MAINTENANCE }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.safetyNotice.findMany({
      where: {
        organizationId: tenant.organizationId,
        publishedAt: { not: null, lte: now },
        AND: [{ OR: [{ propertyId: null }, { propertyId: property.id }] }, { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    db.supervisorAssignment.findFirst({ where: { propertyId: property.id, active: true }, include: { user: { select: { name: true, phone: true } } } }),
  ]);

  const status = lease.status as JourneyLeaseStatus;
  const obligation = (lease.obligation?.status ?? null) as JourneyObligationStatus | null;
  return {
    kind: "tenant",
    firstName,
    lease: {
      id: lease.id,
      property: property.name,
      propertyId: property.id,
      unit: lease.unit.unitNumber,
      address: [property.ward, property.district, property.region].filter(Boolean).join(", "),
      status: titleCase(lease.status),
      rawStatus: status,
      termMonths: lease.termMonths,
      start: dateFmt.format(lease.startDate),
      end: dateFmt.format(lease.endDate),
      amount: money(Number(lease.fullTermAmount), lease.currency),
      payment: obligation ? titleCase(obligation) : "No obligation yet",
    },
    countdown: leaseCountdown(lease.endDate, now),
    rail: railView(lease.startDate, lease.endDate, now),
    next: tenantNextStep({ leaseId: lease.id, status, obligation, endDate: lease.endDate, now }),
    maintenance: maintenance.map((item) => ({ id: item.id, title: item.title, reported: dateFmt.format(item.createdAt), status: titleCase(item.status) })),
    notices: notices.map((notice) => ({ id: notice.id, title: notice.title, published: dateFmt.format(notice.publishedAt ?? notice.createdAt), severity: notice.severity })),
    supervisor: assignment ? { name: assignment.user.name, phone: assignment.user.phone } : null,
  };
}

async function supervisorHome(session: SessionPayload): Promise<RoleHome> {
  const assignments = await db.supervisorAssignment.findMany({ where: { userId: session.userId, active: true }, select: { propertyId: true } });
  const propertyIds = assignments.map((assignment) => assignment.propertyId);
  if (propertyIds.length === 0) return { kind: "pending", role: "SUPERVISOR", canRequestAttachment: false };

  const [firstName, properties, maintenance, renewals] = await Promise.all([
    firstNameOf(session.userId),
    db.property.findMany({
      where: { id: { in: propertyIds } },
      include: {
        units: { select: { id: true, leases: { where: { status: { in: ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] } }, select: { id: true } } } },
        maintenanceRequests: { where: { status: OPEN_MAINTENANCE }, select: { id: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.maintenanceRequest.findMany({ where: { propertyId: { in: propertyIds }, status: OPEN_MAINTENANCE }, include: { property: true }, orderBy: { updatedAt: "desc" }, take: 6 }),
    db.lease.findMany({
      where: { unit: { propertyId: { in: propertyIds } }, status: { in: ["RENEWAL_WINDOW", "GRACE"] } },
      include: { tenant: true, unit: { include: { property: true } } },
      orderBy: { endDate: "asc" },
      take: 6,
    }),
  ]);

  return {
    kind: "supervisor",
    firstName,
    properties: properties.map((property) => ({
      id: property.id,
      name: property.name,
      location: [property.ward, property.district].filter(Boolean).join(", "),
      units: property.units.length,
      occupied: property.units.filter((unit) => unit.leases.length > 0).length,
      openMaintenance: property.maintenanceRequests.length,
    })),
    maintenance: maintenance.map((item) => ({ id: item.id, title: item.title, property: item.property.name, status: titleCase(item.status), priority: titleCase(item.priority) })),
    renewals: renewals.map((lease) => ({ id: lease.id, tenant: lease.tenant.name, unit: `${lease.unit.property.name} · ${lease.unit.unitNumber}`, status: titleCase(lease.status), end: dateFmt.format(lease.endDate) })),
  };
}

function demoTenantHome(): TenantHome {
  const now = new Date();
  const end = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - 182 * 24 * 60 * 60 * 1000);
  return {
    kind: "tenant",
    firstName: "Rehema",
    lease: {
      id: "demo-lease",
      property: "Ocean View Apartments",
      propertyId: "demo-property",
      unit: "A2",
      address: "Masaki, Kinondoni, Dar es Salaam",
      status: "Renewal Window",
      rawStatus: "RENEWAL_WINDOW",
      termMonths: 6,
      start: dateFmt.format(start),
      end: dateFmt.format(end),
      amount: "TZS 5,100,000",
      payment: "Paid",
    },
    countdown: leaseCountdown(end, now),
    rail: railView(start, end, now),
    next: tenantNextStep({ leaseId: "demo-lease", status: "RENEWAL_WINDOW", obligation: "PAID", endDate: end, now }),
    maintenance: [{ id: "demo-m1", title: "Water pressure is low", reported: dateFmt.format(now), status: "Assigned" }],
    notices: [{ id: "demo-n1", title: "Water shutdown on Saturday 08:00–12:00", published: dateFmt.format(now), severity: "WARNING" }],
    supervisor: { name: "Asha M.", phone: "+255 712 000 111" },
  };
}

function demoSupervisorHome(): SupervisorHome {
  return {
    kind: "supervisor",
    firstName: "Asha",
    properties: [
      { id: "demo-p1", name: "Ocean View Apartments", location: "Masaki, Kinondoni", units: 8, occupied: 7, openMaintenance: 1 },
      { id: "demo-p2", name: "Palm Court", location: "Mikocheni, Kinondoni", units: 12, occupied: 8, openMaintenance: 2 },
    ],
    maintenance: [
      { id: "demo-m1", title: "Water pressure is low", property: "Ocean View Apartments", status: "Assigned", priority: "Medium" },
      { id: "demo-m3", title: "Corridor light fault", property: "Palm Court", status: "Reported", priority: "Low" },
    ],
    renewals: [{ id: "demo-l1", tenant: "Rehema K.", unit: "Ocean View Apartments · A2", status: "Renewal Window", end: "06 Nov 2026" }],
  };
}
