"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const listingSchema = z.object({
  unitId: z.string().min(1),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(20).max(3000),
});

export async function saveListing(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to manage listings.");

  const input = listingSchema.parse({
    unitId: formData.get("unitId"),
    title: formData.get("title"),
    description: formData.get("description"),
  });

  const unit = await db.unit.findFirst({
    where: { id: input.unitId, property: { organizationId: session.organizationId } },
    include: { leases: true },
  });
  if (!unit) throw new Error("Unit not found in this organization.");

  const blocked = unit.leases.some((lease) => ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status));

  await db.$transaction(async (tx) => {
    await tx.unit.update({ where: { id: unit.id }, data: { listingEnabled: true } });
    const listing = await tx.propertyListing.upsert({
      where: { unitId: unit.id },
      create: {
        unitId: unit.id,
        title: input.title,
        description: input.description,
        status: blocked ? "BLOCKED" : "ELIGIBLE",
      },
      update: {
        title: input.title,
        description: input.description,
        status: blocked ? "BLOCKED" : "ELIGIBLE",
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "listing.saved",
        resourceType: "PropertyListing",
        resourceId: listing.id,
        metadata: { unitId: unit.id, blockedByOccupancy: blocked },
      },
    });
  });

  revalidatePath("/app/listings");
  revalidatePath("/listings");
}

export async function publishListing(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to publish listings.");
  const listingId = z.string().min(1).parse(formData.get("listingId"));

  const listing = await db.propertyListing.findFirst({
    where: { id: listingId, unit: { property: { organizationId: session.organizationId } } },
    include: { unit: { include: { leases: true } } },
  });
  if (!listing) throw new Error("Listing not found.");

  const blocked = listing.unit.leases.some((lease) => ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status));
  if (blocked) throw new Error("Occupied or protected units cannot be published.");

  await db.$transaction(async (tx) => {
    await tx.propertyListing.update({ where: { id: listing.id }, data: { status: "PUBLISHED", publishedAt: new Date(), pausedAt: null } });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "listing.published",
        resourceType: "PropertyListing",
        resourceId: listing.id,
      },
    });
  });

  revalidatePath("/app/listings");
  revalidatePath("/listings");
}

export async function pauseListing(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to pause listings.");
  const listingId = z.string().min(1).parse(formData.get("listingId"));

  const listing = await db.propertyListing.findFirst({ where: { id: listingId, unit: { property: { organizationId: session.organizationId } } } });
  if (!listing) throw new Error("Listing not found.");

  await db.propertyListing.update({ where: { id: listing.id }, data: { status: "PAUSED", pausedAt: new Date() } });
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "listing.paused",
      resourceType: "PropertyListing",
      resourceId: listing.id,
    },
  });

  revalidatePath("/app/listings");
  revalidatePath("/listings");
}
