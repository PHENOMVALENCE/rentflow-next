import { db, hasDatabaseConfiguration } from "@/server/db";

export type PlatformMetric = {
  label: string;
  value: string;
  detail: string;
};

export type PlatformRow = {
  id: string;
  primary: string;
  secondary: string;
  status: string;
  meta?: string;
};

export type PlatformOverview = {
  metrics: PlatformMetric[];
  incidents: PlatformRow[];
  organizations: PlatformRow[];
  recentActivity: PlatformRow[];
};

const demoOverview: PlatformOverview = {
  metrics: [
    { label: "Organizations", value: "4", detail: "3 active · 1 onboarding" },
    { label: "Platform users", value: "18", detail: "Across all roles" },
    { label: "Open incidents", value: "1", detail: "No critical incidents" },
    { label: "Payment exceptions", value: "2", detail: "Require operator review" },
  ],
  incidents: [
    { id: "demo-incident", primary: "Payment webhook retry spike", secondary: "Snippe reconciliation", status: "OPEN", meta: "MEDIUM" },
  ],
  organizations: [
    { id: "demo-org-1", primary: "Mikocheni Property Group", secondary: "12 properties", status: "ACTIVE", meta: "8 users" },
    { id: "demo-org-2", primary: "Kijitonyama Residences", secondary: "6 properties", status: "ACTIVE", meta: "5 users" },
  ],
  recentActivity: [
    { id: "demo-audit-1", primary: "lease.lifecycle.transition", secondary: "Lease moved to renewal window", status: "AUDIT", meta: "2 min ago" },
    { id: "demo-audit-2", primary: "payment.reconciled", secondary: "Exact-term payment settled", status: "AUDIT", meta: "9 min ago" },
  ],
};

export async function getPlatformOverview(): Promise<PlatformOverview> {
  if (!hasDatabaseConfiguration()) return demoOverview;

  const [organizationCount, userCount, incidentCount, exceptionCount, incidents, organizations, activity] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.platformIncident.count({ where: { status: { not: "RESOLVED" } } }),
    db.paymentTransaction.count({ where: { status: "EXCEPTION" } }),
    db.platformIncident.findMany({ orderBy: { openedAt: "desc" }, take: 6 }),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { _count: { select: { properties: true, memberships: true } } },
    }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return {
    metrics: [
      { label: "Organizations", value: String(organizationCount), detail: "Registered workspaces" },
      { label: "Platform users", value: String(userCount), detail: "All account roles" },
      { label: "Open incidents", value: String(incidentCount), detail: "Acknowledgement required" },
      { label: "Payment exceptions", value: String(exceptionCount), detail: "Manual reconciliation queue" },
    ],
    incidents: incidents.map((incident) => ({
      id: incident.id,
      primary: incident.summary,
      secondary: incident.service,
      status: incident.status,
      meta: incident.severity,
    })),
    organizations: organizations.map((organization) => ({
      id: organization.id,
      primary: organization.name,
      secondary: `${organization._count.properties} properties`,
      status: organization.active ? "ACTIVE" : "INACTIVE",
      meta: `${organization._count.memberships} users`,
    })),
    recentActivity: activity.map((entry) => ({
      id: entry.id,
      primary: entry.action,
      secondary: `${entry.resourceType}${entry.resourceId ? ` · ${entry.resourceId}` : ""}`,
      status: "AUDIT",
      meta: entry.createdAt.toISOString(),
    })),
  };
}

export async function getPlatformOrganizations(): Promise<PlatformRow[]> {
  if (!hasDatabaseConfiguration()) return demoOverview.organizations;
  const rows = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { properties: true, memberships: true } } },
  });
  return rows.map((organization) => ({
    id: organization.id,
    primary: organization.name,
    secondary: `${organization._count.properties} properties`,
    status: organization.active ? "ACTIVE" : "INACTIVE",
    meta: `${organization._count.memberships} users`,
  }));
}

export async function getPlatformUsers(): Promise<PlatformRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "demo-user-1", primary: "Platform Administrator", secondary: "admin@rentflow.local", status: "PLATFORM_ADMIN", meta: "Active" },
      { id: "demo-user-2", primary: "Property Manager", secondary: "manager@rentflow.local", status: "PROPERTY_ADMIN", meta: "Active" },
    ];
  }
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return users.map((user) => ({
    id: user.id,
    primary: user.name,
    secondary: user.email,
    status: user.role,
    meta: user.lastLoginAt ? `Last login ${user.lastLoginAt.toISOString()}` : "Never signed in",
  }));
}

export async function getPlatformIncidents(): Promise<PlatformRow[]> {
  if (!hasDatabaseConfiguration()) return demoOverview.incidents;
  const incidents = await db.platformIncident.findMany({ orderBy: { openedAt: "desc" }, take: 100 });
  return incidents.map((incident) => ({
    id: incident.id,
    primary: incident.summary,
    secondary: incident.service,
    status: incident.status,
    meta: incident.severity,
  }));
}

export async function getPlatformPayments(): Promise<PlatformRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [
      { id: "demo-payment-1", primary: "RF-LEASE-000021", secondary: "TZS 1,800,000 · SNIPPE", status: "SUCCEEDED", meta: "Exact settlement" },
      { id: "demo-payment-2", primary: "RF-LEASE-000022", secondary: "TZS 900,000 received of TZS 1,200,000", status: "EXCEPTION", meta: "Manual review" },
    ];
  }
  const transactions = await db.paymentTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { obligation: true },
  });
  return transactions.map((transaction) => ({
    id: transaction.id,
    primary: transaction.obligation.internalReference,
    secondary: `${transaction.currency} ${transaction.receivedAmount ?? transaction.requestedAmount} · ${transaction.provider}`,
    status: transaction.status,
    meta: transaction.providerReference ?? "No provider reference",
  }));
}

export async function getPlatformNotifications(): Promise<PlatformRow[]> {
  if (!hasDatabaseConfiguration()) {
    return [{ id: "demo-notification", primary: "Lease renewal window opened", secondary: "In-app lifecycle notification", status: "SENT", meta: "Tenant" }];
  }
  const rows = await db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return rows.map((notification) => ({
    id: notification.id,
    primary: notification.subject ?? notification.channel,
    secondary: notification.body,
    status: notification.status,
    meta: notification.channel,
  }));
}

export async function getPlatformActivity(): Promise<PlatformRow[]> {
  if (!hasDatabaseConfiguration()) return demoOverview.recentActivity;
  const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return rows.map((entry) => ({
    id: entry.id,
    primary: entry.action,
    secondary: `${entry.resourceType}${entry.resourceId ? ` · ${entry.resourceId}` : ""}`,
    status: "AUDIT",
    meta: entry.createdAt.toISOString(),
  }));
}
