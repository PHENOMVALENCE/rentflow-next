"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const propertySchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED_USE"]),
  address: z.string().trim().min(3).max(300),
  region: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  ward: z.string().trim().max(100).optional(),
});

const unitSchema = z.object({
  propertyId: z.string().min(1),
  unitNumber: z.string().trim().min(1).max(50),
  type: z.enum(["APARTMENT", "SHOP", "OFFICE", "STORE", "OTHER"]),
  monthlyRent: z.coerce.number().nonnegative(),
  floor: z.string().trim().max(50).optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
});

export async function createProperty(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to create properties.");

  const input = propertySchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
    address: formData.get("address"),
    region: formData.get("region"),
    district: formData.get("district"),
    ward: formData.get("ward") || undefined,
  });

  await db.$transaction(async (tx) => {
    const property = await tx.property.create({ data: { ...input, organizationId: session.organizationId! } });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "property.created",
        resourceType: "Property",
        resourceId: property.id,
      },
    });
  });

  revalidatePath("/app/properties");
  revalidatePath("/app");
}

export async function createUnit(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to create units.");

  const input = unitSchema.parse({
    propertyId: formData.get("propertyId"),
    unitNumber: formData.get("unitNumber"),
    type: formData.get("type"),
    monthlyRent: formData.get("monthlyRent"),
    floor: formData.get("floor") || undefined,
    bedrooms: formData.get("bedrooms") || undefined,
    bathrooms: formData.get("bathrooms") || undefined,
  });

  const property = await db.property.findFirst({ where: { id: input.propertyId, organizationId: session.organizationId } });
  if (!property) throw new Error("Property not found in this organization.");

  await db.$transaction(async (tx) => {
    const unit = await tx.unit.create({
      data: {
        ...input,
        monthlyRent: input.monthlyRent,
        currency: "TZS",
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "unit.created",
        resourceType: "Unit",
        resourceId: unit.id,
        metadata: { propertyId: property.id },
      },
    });
  });

  revalidatePath("/app/units");
  revalidatePath("/app/properties");
}
