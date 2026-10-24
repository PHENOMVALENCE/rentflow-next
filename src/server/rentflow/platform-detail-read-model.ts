import type { Prisma } from "@prisma/client";
import { maskTanzaniaPhone } from "@/server/auth/phone";
import { db, hasDatabaseConfiguration } from "@/server/db";

/**
 * Platform detail screens (Laravel `platform/{organizations,users,payments,incidents}/show`).
 * Platform-admin only; callers must check the role. Provider payloads and secrets are never returned.
 */

const when = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Dar_es_Salaam" });
const amount = (value: unknown, currency: string) => `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value))}`;
const human = (value: string) => value.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export type AuditLine = { id: string; action: string; resource: string; at: string };

async function auditFor(where: Prisma.AuditLogWhereInput): Promise<AuditLine[]> {
  const rows = await db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 10 });
  return rows.map((row) => ({ id: row.id, action: row.action, resource: `${row.resourceType}${row.resourceId ? ` · ${row.resourceId}` : ""}`, at: when.format(row.createdAt) }));
}

export type OrganizationDetail = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created: string;
  counts: { properties: number; units: number; tenants: number; activeLeases: number; members: number };
  members: { id: string; name: string; role: string }[];
  audit: AuditLine[];
};

export async function getOrganizationDetail(id: string): Promise<OrganizationDetail | null> {
  if (!hasDatabaseConfiguration()) {
    if (!id.startsWith("demo-org")) return null;
    return {
      id,
      name: id === "demo-org-2" ? "Kijitonyama Residences" : "Mikocheni Property Group",
      slug: "mikocheni-property-group",
      active: true,
      created: when.format(new Date("2026-08-01T07:00:00Z")),
      counts: { properties: 12, units: 46, tenants: 37, activeLeases: 35, members: 8 },
      members: [{ id: "demo-user-2", name: "Property Manager", role: "Property admin" }],
      audit: [{ id: "demo-audit-1", action: "lease.lifecycle_transition", resource: "Lease · demo", at: when.format(new Date()) }],
    };
  }

  const organization = await db.organization.findUnique({
    where: { id },
    include: { memberships: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!organization) return null;

  const [properties, units, tenants, activeLeases, audit] = await Promise.all([
    db.property.count({ where: { organizationId: id } }),
    db.unit.count({ where: { property: { organizationId: id } } }),
    db.tenant.count({ where: { organizationId: id } }),
    db.lease.count({ where: { unit: { property: { organizationId: id } }, status: { in: ["ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } }),
    auditFor({ organizationId: id }),
  ]);

  return {
    id,
    name: organization.name,
    slug: organization.slug,
    active: organization.active,
    created: when.format(organization.createdAt),
    counts: { properties, units, tenants, activeLeases, members: organization.memberships.length },
    members: organization.memberships.map((member) => ({ id: member.user.id, name: member.user.name, role: human(member.role) })),
    audit,
  };
}

export type UserDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  lastLogin: string;
  created: string;
  organizations: { id: string; name: string; role: string }[];
  assignments: number;
  audit: AuditLine[];
};

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  if (!hasDatabaseConfiguration()) {
    if (!id.startsWith("demo-user")) return null;
    return {
      id,
      name: id === "demo-user-1" ? "Platform Administrator" : "Property Manager",
      email: id === "demo-user-1" ? "admin@rentflow.local" : "manager@rentflow.local",
      phone: "+255 7•• ••• 111",
      role: id === "demo-user-1" ? "Platform admin" : "Property admin",
      lastLogin: when.format(new Date()),
      created: when.format(new Date("2026-08-01T07:00:00Z")),
      organizations: id === "demo-user-1" ? [] : [{ id: "demo-org-1", name: "Mikocheni Property Group", role: "Property admin" }],
      assignments: 0,
      audit: [],
    };
  }

  const user = await db.user.findUnique({
    where: { id },
    include: { memberships: { include: { organization: { select: { id: true, name: true } } } }, _count: { select: { supervisorAssignments: { where: { active: true } } } } },
  });
  if (!user) return null;

  return {
    id,
    name: user.name,
    email: user.email,
    // Masked: platform operators identify accounts without reading full personal numbers.
    phone: user.phone ? maskTanzaniaPhone(user.phone) : null,
    role: human(user.role),
    lastLogin: user.lastLoginAt ? when.format(user.lastLoginAt) : "Never signed in",
    created: when.format(user.createdAt),
    organizations: user.memberships.map((member) => ({ id: member.organization.id, name: member.organization.name, role: human(member.role) })),
    assignments: user._count.supervisorAssignments,
    audit: await auditFor({ actorId: id }),
  };
}

export type PaymentDetail = {
  id: string;
  status: string;
  provider: string;
  providerReference: string | null;
  internalReference: string;
  requested: string;
  received: string | null;
  failureReason: string | null;
  obligationStatus: string;
  obligationAmount: string;
  organization: { id: string; name: string } | null;
  unit: string;
  created: string;
  updated: string;
  matches: boolean;
  audit: AuditLine[];
};

export async function getPaymentDetail(id: string): Promise<PaymentDetail | null> {
  if (!hasDatabaseConfiguration()) {
    if (!id.startsWith("demo-payment")) return null;
    const exception = id === "demo-payment-2";
    return {
      id,
      status: exception ? "Exception" : "Succeeded",
      provider: "SNIPPE",
      providerReference: exception ? "snp_demo_2" : "snp_demo_1",
      internalReference: exception ? "RF-LEASE-000022" : "RF-LEASE-000021",
      requested: exception ? "TZS 1,200,000" : "TZS 1,800,000",
      received: exception ? "TZS 900,000" : "TZS 1,800,000",
      failureReason: exception ? "Received amount does not equal the exact full-term obligation." : null,
      obligationStatus: exception ? "Exception" : "Paid",
      obligationAmount: exception ? "TZS 1,200,000" : "TZS 1,800,000",
      organization: { id: "demo-org-1", name: "Mikocheni Property Group" },
      unit: "Ocean View Apartments · A2",
      created: when.format(new Date()),
      updated: when.format(new Date()),
      matches: !exception,
      audit: [],
    };
  }

  const transaction = await db.paymentTransaction.findUnique({
    where: { id },
    include: { obligation: { include: { lease: { include: { unit: { include: { property: { include: { organization: { select: { id: true, name: true } } } } } } } } } } },
  });
  if (!transaction) return null;
  const { obligation } = transaction;
  const property = obligation.lease.unit.property;

  return {
    id,
    status: human(transaction.status),
    provider: transaction.provider,
    providerReference: transaction.providerReference,
    internalReference: obligation.internalReference,
    requested: amount(transaction.requestedAmount, transaction.currency),
    received: transaction.receivedAmount === null ? null : amount(transaction.receivedAmount, transaction.currency),
    failureReason: transaction.failureReason,
    obligationStatus: human(obligation.status),
    obligationAmount: amount(obligation.amount, obligation.currency),
    organization: property.organization,
    unit: `${property.name} · ${obligation.lease.unit.unitNumber}`,
    created: when.format(transaction.createdAt),
    updated: when.format(transaction.updatedAt),
    matches: transaction.receivedAmount !== null && Number(transaction.receivedAmount) === Number(obligation.amount) && transaction.currency === obligation.currency,
    audit: await auditFor({ OR: [{ resourceType: "PaymentTransaction", resourceId: id }, { resourceType: "PaymentObligation", resourceId: obligation.id }] }),
  };
}

export type IncidentDetail = {
  id: string;
  summary: string;
  service: string;
  severity: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  correlationId: string | null;
  opened: string;
  acknowledged: string | null;
  resolved: string | null;
  audit: AuditLine[];
};

export async function getIncidentDetail(id: string): Promise<IncidentDetail | null> {
  if (!hasDatabaseConfiguration()) {
    if (id !== "demo-incident") return null;
    return { id, summary: "Payment webhook retry spike", service: "Snippe reconciliation", severity: "MEDIUM", status: "OPEN", correlationId: "corr-demo", opened: when.format(new Date()), acknowledged: null, resolved: null, audit: [] };
  }
  const incident = await db.platformIncident.findUnique({ where: { id } });
  if (!incident) return null;
  return {
    id,
    summary: incident.summary,
    service: incident.service,
    severity: incident.severity,
    status: incident.status,
    correlationId: incident.correlationId,
    opened: when.format(incident.openedAt),
    acknowledged: incident.acknowledgedAt ? when.format(incident.acknowledgedAt) : null,
    resolved: incident.resolvedAt ? when.format(incident.resolvedAt) : null,
    audit: await auditFor({ OR: [{ resourceType: "PlatformIncident", resourceId: id }, ...(incident.correlationId ? [{ correlationId: incident.correlationId }] : [])] }),
  };
}
