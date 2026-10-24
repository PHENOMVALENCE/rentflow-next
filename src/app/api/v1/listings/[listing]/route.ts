import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { apiError, apiSession, isApiError, jsonData } from "@/server/api/v1";

const protectedStates = ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;

export async function GET(_request: Request, { params }: { params: Promise<{ listing: string }> }) {
  if (!hasDatabaseConfiguration()) return jsonData({ message: "Not found" }, { status: 404 });
  const { listing: id } = await params;
  const listing = await db.propertyListing.findFirst({ where: { id, status: "PUBLISHED", unit: { leases: { none: { status: { in: [...protectedStates] } } } } }, include: { unit: { include: { property: true } }, images: { orderBy: { position: "asc" } } } });
  return listing ? jsonData({ data: listing }) : jsonData({ message: "Not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ listing: string }> }) {
  const session = await apiSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (isApiError(session)) return session;
  const { listing: id } = await params;
  try {
    const input = z.object({ title: z.string().trim().min(2).max(180).optional(), description: z.string().trim().min(2).max(5000).optional(), status: z.enum(["DRAFT", "ELIGIBLE", "PUBLISHED", "PAUSED", "WITHDRAWN", "BLOCKED"]).optional() }).parse(await request.json());
    const listing = await db.propertyListing.findFirst({ where: { id, unit: { property: { ...(session.organizationId && session.role !== "PLATFORM_ADMIN" ? { organizationId: session.organizationId } : {}) } } }, include: { unit: { include: { leases: true, property: true } } } });
    if (!listing) return jsonData({ message: "Not found" }, { status: 404 });
    if (input.status === "PUBLISHED" && listing.unit.leases.some((lease) => protectedStates.includes(lease.status as (typeof protectedStates)[number]))) return jsonData({ message: "Occupied units cannot be published" }, { status: 422 });
    const updated = await db.propertyListing.update({ where: { id }, data: { ...input, publishedAt: input.status === "PUBLISHED" ? new Date() : undefined, pausedAt: input.status === "PAUSED" ? new Date() : undefined } });
    await db.auditLog.create({ data: { organizationId: listing.unit.property.organizationId, actorId: session.userId, action: "listing.updated", resourceType: "PropertyListing", resourceId: id, metadata: input } });
    return jsonData({ data: updated });
  } catch (error) { return apiError(error); }
}
