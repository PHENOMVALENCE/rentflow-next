import { db, hasDatabaseConfiguration } from "@/server/db";
import type { PlatformRow } from "./platform-read-model";

export type PlatformSearchResults = {
  query: string;
  results: PlatformRow[];
};

export async function searchPlatform(rawQuery: string): Promise<PlatformSearchResults> {
  const query = rawQuery.trim().slice(0, 100);
  if (query.length < 2) return { query, results: [] };

  if (!hasDatabaseConfiguration()) {
    const demo: PlatformRow[] = [
      { id: "demo-org", primary: "Mikocheni Property Group", secondary: "Organization", status: "ORGANIZATION", meta: "Workspace" },
      { id: "demo-property", primary: "Mikocheni Heights", secondary: "Property · Dar es Salaam", status: "PROPERTY", meta: "Portfolio" },
      { id: "demo-payment", primary: "RF-LEASE-000022", secondary: "Payment exception", status: "PAYMENT", meta: "SNIPPE" },
    ];
    const needle = query.toLowerCase();
    return { query, results: demo.filter((row) => `${row.primary} ${row.secondary} ${row.meta ?? ""}`.toLowerCase().includes(needle)) };
  }

  const [organizations, users, properties, payments, incidents, audits] = await Promise.all([
    db.organization.findMany({
      where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] },
      take: 10,
    }),
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    db.property.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
          { region: { contains: query, mode: "insensitive" } },
          { district: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { organization: { select: { name: true } } },
      take: 10,
    }),
    db.paymentTransaction.findMany({
      where: {
        OR: [
          { providerReference: { contains: query, mode: "insensitive" } },
          { eventId: { contains: query, mode: "insensitive" } },
          { obligation: { internalReference: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: { obligation: true },
      take: 10,
    }),
    db.platformIncident.findMany({
      where: {
        OR: [
          { summary: { contains: query, mode: "insensitive" } },
          { service: { contains: query, mode: "insensitive" } },
          { correlationId: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    db.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: query, mode: "insensitive" } },
          { resourceType: { contains: query, mode: "insensitive" } },
          { resourceId: { contains: query, mode: "insensitive" } },
          { correlationId: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results: PlatformRow[] = [
    ...organizations.map((row) => ({ id: `org:${row.id}`, primary: row.name, secondary: row.slug, status: "ORGANIZATION", meta: row.active ? "Active" : "Inactive" })),
    ...users.map((row) => ({ id: `user:${row.id}`, primary: row.name, secondary: row.email, status: "USER", meta: row.role })),
    ...properties.map((row) => ({ id: `property:${row.id}`, primary: row.name, secondary: `${row.organization.name} · ${row.address}`, status: "PROPERTY", meta: `${row.region}, ${row.district}` })),
    ...payments.map((row) => ({ id: `payment:${row.id}`, primary: row.obligation.internalReference, secondary: row.providerReference ?? row.provider, status: "PAYMENT", meta: row.status })),
    ...incidents.map((row) => ({ id: `incident:${row.id}`, primary: row.summary, secondary: row.service, status: "INCIDENT", meta: row.status })),
    ...audits.map((row) => ({ id: `audit:${row.id}`, primary: row.action, secondary: `${row.resourceType}${row.resourceId ? ` · ${row.resourceId}` : ""}`, status: "AUDIT", meta: row.createdAt.toISOString() })),
  ];

  return { query, results };
}
