import type { SessionPayload } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { resolveScope } from "./operations-read-model";
import { hasReport, reportCatalog, reportLabel, type ReportCategory } from "./report-catalog";

/**
 * Runs catalog reports (Laravel `livewire/app/reports`) against authoritative records, scoped to the session.
 * Each report returns plain columns/rows so the page and the CSV export share one implementation.
 */

export type ReportCell = string | number | null;
export type ReportResult =
  | { status: "ok"; title: string; columns: string[]; rows: ReportCell[][]; note?: string }
  | { status: "unavailable"; title: string; reason: string };

const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Dar_es_Salaam" });
const d = (value: Date | null | undefined) => (value ? day.format(value) : null);
const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));
const human = (value: string) => value.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const OCCUPIED = ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;

/** Reports that need records the Next.js schema does not have yet. Shown with the reason instead of an empty table. */
const UNAVAILABLE: Record<string, string> = {
  "financial/expenses": "Expenses are not recorded in RentFlow Next yet; the schema has no expense model.",
  "financial/statement": "Rent statements need the letterhead document generator, which is not ported yet.",
  "compliance/saved": "Saved report definitions are not ported yet.",
  "compliance/controls": "Financial control checks depend on the expense and statement models.",
  "performance/scorecard": "The property scorecard combines expenses with collections; it returns once expenses exist.",
};

type Scope = Awaited<ReturnType<typeof resolveScope>>;

function filters(scope: Scope) {
  const property = { ...(scope.organizationId ? { organizationId: scope.organizationId } : {}), ...(scope.propertyIds ? { id: { in: scope.propertyIds } } : {}) };
  const unit = { property };
  const lease = { unit };
  return { property, unit, lease };
}

export function listReports() {
  return (Object.keys(reportCatalog) as ReportCategory[]).map((category) => ({
    category,
    label: reportCatalog[category].label,
    reports: Object.entries(reportCatalog[category].reports).map(([key, label]) => ({ key, label, available: !UNAVAILABLE[`${category}/${key}`] })),
  }));
}

export async function runReport(session: SessionPayload, category: string, report: string, now = new Date()): Promise<ReportResult | null> {
  if (!hasReport(category, report)) return null;
  const title = `${reportCatalog[category].label} · ${reportLabel(category, report)}`;
  const unavailable = UNAVAILABLE[`${category}/${report}`];
  if (unavailable) return { status: "unavailable", title, reason: unavailable };
  if (!hasDatabaseConfiguration()) return { status: "unavailable", title, reason: "Reports read live records. Connect the database to run this report." };

  const scope = await resolveScope(session);
  const where = filters(scope);
  const key = `${category}/${report}`;

  const table = (columns: string[], rows: ReportCell[][], note?: string): ReportResult => ({ status: "ok", title, columns, rows, note });

  switch (key) {
    case "overview/summary":
    case "properties/occupancy": {
      const properties = await db.property.findMany({
        where: where.property,
        include: { units: { select: { leases: { where: { status: { in: [...OCCUPIED] } }, select: { id: true } } } } },
        orderBy: { name: "asc" },
      });
      return table(["Property", "Region", "Units", "Occupied", "Vacant", "Occupancy %"], properties.map((p) => {
        const occupied = p.units.filter((u) => u.leases.length > 0).length;
        return [p.name, p.region, p.units.length, occupied, p.units.length - occupied, p.units.length ? Math.round((occupied / p.units.length) * 100) : 0];
      }));
    }
    case "properties/properties": {
      const rows = await db.property.findMany({ where: where.property, include: { _count: { select: { units: true, buildings: true } } }, orderBy: { name: "asc" } });
      return table(["Property", "Type", "Region", "District", "Ward", "Buildings", "Units", "Active"], rows.map((p) => [p.name, human(p.type), p.region, p.district, p.ward, p._count.buildings, p._count.units, p.active ? "Yes" : "No"]));
    }
    case "properties/buildings": {
      const rows = await db.building.findMany({ where: { property: where.property }, include: { property: { select: { name: true } }, _count: { select: { units: true } } }, orderBy: [{ property: { name: "asc" } }, { name: "asc" }] });
      return table(["Property", "Building", "Floors", "Units"], rows.map((b) => [b.property.name, b.name, b.floors, b._count.units]));
    }
    case "properties/units": {
      const rows = await db.unit.findMany({ where: where.unit, include: { property: { select: { name: true } }, building: { select: { name: true } }, leases: { where: { status: { in: [...OCCUPIED] } }, select: { status: true } }, listing: { select: { status: true } } }, orderBy: [{ property: { name: "asc" } }, { unitNumber: "asc" }] });
      return table(["Property", "Building", "Unit", "Type", "Monthly rent", "Currency", "Occupancy", "Listing"], rows.map((u) => [u.property.name, u.building?.name ?? null, u.unitNumber, human(u.type), num(u.monthlyRent), u.currency, u.leases[0] ? human(u.leases[0].status) : "Vacant", u.listing ? human(u.listing.status) : "Not listed"]));
    }
    case "leases/expiring":
    case "performance/renewals": {
      const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const rows = await db.lease.findMany({ where: { ...where.lease, status: { in: [...OCCUPIED] }, endDate: { lte: horizon } }, include: { tenant: { select: { name: true } }, unit: { include: { property: { select: { name: true } } } } }, orderBy: { endDate: "asc" } });
      return table(["Tenant", "Property", "Unit", "Status", "Term (months)", "Ends", "Full-term amount"], rows.map((l) => [l.tenant.name, l.unit.property.name, l.unit.unitNumber, human(l.status), l.termMonths, d(l.endDate), num(l.fullTermAmount)]), "Leases ending within 30 days, including renewal window and grace.");
    }
    case "leases/history":
    case "leases/performance":
    case "performance/records": {
      const rows = await db.lease.findMany({ where: where.lease, include: { tenant: { select: { name: true } }, unit: { include: { property: { select: { name: true } } } }, obligation: { select: { status: true } } }, orderBy: { startDate: "desc" }, take: 2000 });
      return table(["Tenant", "Property", "Unit", "Status", "Term (months)", "Start", "End", "Full-term amount", "Payment"], rows.map((l) => [l.tenant.name, l.unit.property.name, l.unit.unitNumber, human(l.status), l.termMonths, d(l.startDate), d(l.endDate), num(l.fullTermAmount), l.obligation ? human(l.obligation.status) : null]));
    }
    case "financial/collections":
    case "performance/collections":
    case "financial/summary": {
      const rows = await db.paymentObligation.findMany({ where: { lease: where.lease, status: "PAID", paidAt: { not: null } }, select: { amount: true, currency: true, paidAt: true } });
      const byMonth = new Map<string, number>();
      for (const row of rows) {
        const month = row.paidAt!.toISOString().slice(0, 7);
        byMonth.set(`${month}|${row.currency}`, (byMonth.get(`${month}|${row.currency}`) ?? 0) + Number(row.amount));
      }
      return table(["Month", "Currency", "Confirmed collections"], [...byMonth.entries()].sort().reverse().map(([k, total]) => [k.split("|")[0], k.split("|")[1], total]), "Only provider-confirmed exact full-term payments count as collected.");
    }
    case "financial/outstanding":
    case "financial/overdue":
    case "financial/by-lease": {
      const statusFilter = key === "financial/by-lease" ? {} : { status: { in: ["PENDING", "EXCEPTION"] as ("PENDING" | "EXCEPTION")[] } };
      const rows = await db.paymentObligation.findMany({ where: { lease: where.lease, ...statusFilter }, include: { lease: { include: { tenant: { select: { name: true } }, unit: { include: { property: { select: { name: true } } } } } } }, orderBy: { createdAt: "desc" } });
      const filtered = key === "financial/overdue" ? rows.filter((o) => o.lease.startDate.getTime() <= now.getTime()) : rows;
      return table(["Reference", "Tenant", "Property", "Unit", "Term start", "Amount", "Currency", "Status", "Paid on"], filtered.map((o) => [o.internalReference, o.lease.tenant.name, o.lease.unit.property.name, o.lease.unit.unitNumber, d(o.lease.startDate), num(o.amount), o.currency, human(o.status), d(o.paidAt)]), key === "financial/overdue" ? "Terms that started without a confirmed full payment." : undefined);
    }
    case "financial/payments": {
      const rows = await db.paymentTransaction.findMany({ where: { obligation: { lease: where.lease } }, include: { obligation: { select: { internalReference: true } } }, orderBy: { createdAt: "desc" }, take: 2000 });
      return table(["Date", "Reference", "Provider", "Provider reference", "Requested", "Received", "Currency", "Status"], rows.map((t) => [d(t.createdAt), t.obligation.internalReference, t.provider, t.providerReference, num(t.requestedAmount), num(t.receivedAmount), t.currency, human(t.status)]));
    }
    case "tenants/overview":
    case "tenants/status":
    case "tenants/history":
    case "compliance/records": {
      const rows = await db.tenant.findMany({
        where: { ...(scope.organizationId ? { organizationId: scope.organizationId } : {}), ...(scope.propertyIds ? { leases: { some: { unit: { propertyId: { in: scope.propertyIds } } } } } : {}) },
        include: { leases: { include: { unit: { include: { property: { select: { name: true } } } } }, orderBy: { endDate: "desc" } }, profile: { select: { id: true } } },
        orderBy: { name: "asc" },
      });
      return table(["Tenant", "Status", "Current unit", "Lease status", "Lease ends", "Leases on record", "Account linked", "Profile complete"], rows.map((t) => {
        const current = t.leases.find((l) => (OCCUPIED as readonly string[]).includes(l.status)) ?? t.leases[0];
        return [t.name, human(t.status), current ? `${current.unit.property.name} · ${current.unit.unitNumber}` : null, current ? human(current.status) : null, d(current?.endDate), t.leases.length, t.userId ? "Yes" : "No", t.profile ? "Yes" : "No"];
      }));
    }
    case "maintenance/overview":
    case "maintenance/open":
    case "maintenance/resolution": {
      const status = key === "maintenance/open" ? { status: { notIn: ["RESOLVED", "CLOSED"] as ("RESOLVED" | "CLOSED")[] } } : key === "maintenance/resolution" ? { status: { in: ["RESOLVED", "CLOSED"] as ("RESOLVED" | "CLOSED")[] } } : {};
      const rows = await db.maintenanceRequest.findMany({ where: { property: where.property, ...status }, include: { property: { select: { name: true } }, unit: { select: { unitNumber: true } } }, orderBy: { createdAt: "desc" }, take: 2000 });
      return table(["Reported", "Property", "Unit", "Title", "Priority", "Status", "Days open"], rows.map((m) => [d(m.createdAt), m.property.name, m.unit?.unitNumber ?? null, m.title, human(m.priority), human(m.status), Math.max(0, Math.round(((["RESOLVED", "CLOSED"].includes(m.status) ? m.updatedAt : now).getTime() - m.createdAt.getTime()) / 86_400_000))]));
    }
    case "supervisors/assignments":
    case "supervisors/activity": {
      const rows = await db.supervisorAssignment.findMany({ where: { property: where.property }, include: { user: { select: { name: true } }, property: { select: { name: true } } }, orderBy: [{ property: { name: "asc" } }] });
      return table(["Supervisor", "Property", "Active", "Since", "Until"], rows.map((a) => [a.user.name, a.property.name, a.active ? "Yes" : "No", d(a.startsAt), d(a.endsAt)]));
    }
    case "compliance/leases":
    case "compliance/documents": {
      const rows = await db.lease.findMany({ where: { ...where.lease, status: { in: [...OCCUPIED, "AWAITING_PAYMENT"] } }, include: { tenant: { select: { name: true } }, unit: { include: { property: { select: { name: true } } } }, _count: { select: { documents: true } } }, orderBy: { endDate: "asc" } });
      return table(["Tenant", "Property", "Unit", "Status", "Agreement files", "Compliant"], rows.map((l) => [l.tenant.name, l.unit.property.name, l.unit.unitNumber, human(l.status), l._count.documents, l._count.documents > 0 ? "Yes" : "Missing agreement"]));
    }
    case "compliance/data": {
      const [noPhone, noProfile, unitsNoRent] = await Promise.all([
        db.tenant.count({ where: { ...(scope.organizationId ? { organizationId: scope.organizationId } : {}), phone: "" } }),
        db.tenant.count({ where: { ...(scope.organizationId ? { organizationId: scope.organizationId } : {}), profile: null } }),
        db.unit.count({ where: { ...where.unit, monthlyRent: null } }),
      ]);
      return table(["Check", "Records"], [["Tenants without a phone number", noPhone], ["Tenants without a profile", noProfile], ["Units without an indicative rent", unitsNoRent]]);
    }
    case "compliance/audit": {
      const rows = await db.auditLog.findMany({ where: scope.organizationId ? { organizationId: scope.organizationId } : {}, orderBy: { createdAt: "desc" }, take: 2000 });
      return table(["When", "Action", "Resource", "Resource ID", "Actor"], rows.map((a) => [d(a.createdAt), a.action, a.resourceType, a.resourceId, a.actorId]));
    }
    default:
      return { status: "unavailable", title, reason: "This report is not implemented yet." };
  }
}
