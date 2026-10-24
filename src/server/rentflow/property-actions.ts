"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

const buildingSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  floors: z.coerce.number().int().min(1).max(200).optional(),
});

async function managedProperty(id: string, organizationId: string | null) {
  return db.property.findFirst({ where: { id, ...(organizationId ? { organizationId } : {}) } });
}

export async function createProperty(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to create properties.");
  const input = propertySchema.parse({ name: formData.get("name"), type: formData.get("type"), address: formData.get("address"), region: formData.get("region"), district: formData.get("district"), ward: formData.get("ward") || undefined });
  await db.$transaction(async (tx) => {
    const property = await tx.property.create({ data: { ...input, organizationId: session.organizationId! } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, action: "property.created", resourceType: "Property", resourceId: property.id } });
  });
  revalidatePath("/app/properties"); revalidatePath("/app");
}

export async function updateProperty(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const propertyId = z.string().min(1).parse(formData.get("propertyId"));
  const input = propertySchema.parse({ name: formData.get("name"), type: formData.get("type"), address: formData.get("address"), region: formData.get("region"), district: formData.get("district"), ward: formData.get("ward") || undefined });
  const property = await managedProperty(propertyId, session.organizationId);
  if (!property) throw new Error("Property not found in your organization.");
  await db.$transaction([
    db.property.update({ where: { id: property.id }, data: { ...input, ward: input.ward || null } }),
    db.auditLog.create({ data: { organizationId: property.organizationId, actorId: session.userId, action: "property.updated", resourceType: "Property", resourceId: property.id } }),
  ]);
  revalidatePath(`/app/properties/${property.id}`); revalidatePath("/app/properties");
  redirect(`/app/properties/${property.id}`);
}

export async function createUnit(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to create units.");
  const input = unitSchema.parse({ propertyId: formData.get("propertyId"), unitNumber: formData.get("unitNumber"), type: formData.get("type"), monthlyRent: formData.get("monthlyRent"), floor: formData.get("floor") || undefined, bedrooms: formData.get("bedrooms") || undefined, bathrooms: formData.get("bathrooms") || undefined });
  const property = await db.property.findFirst({ where: { id: input.propertyId, organizationId: session.organizationId } });
  if (!property) throw new Error("Property not found in this organization.");
  await db.$transaction(async (tx) => {
    const unit = await tx.unit.create({ data: { ...input, monthlyRent: input.monthlyRent, currency: "TZS" } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, action: "unit.created", resourceType: "Unit", resourceId: unit.id, metadata: { propertyId: property.id } } });
  });
  revalidatePath("/app/units"); revalidatePath("/app/properties");
}

export async function updateUnit(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const unitId = z.string().min(1).parse(formData.get("unitId"));
  const input = unitSchema.parse({ propertyId: formData.get("propertyId"), unitNumber: formData.get("unitNumber"), type: formData.get("type"), monthlyRent: formData.get("monthlyRent"), floor: formData.get("floor") || undefined, bedrooms: formData.get("bedrooms") || undefined, bathrooms: formData.get("bathrooms") || undefined });
  const unit = await db.unit.findFirst({ where: { id: unitId, property: { ...(session.organizationId ? { organizationId: session.organizationId } : {}) } }, include: { property: true } });
  if (!unit || unit.propertyId !== input.propertyId) throw new Error("Unit not found in this property.");
  await db.$transaction([
    db.unit.update({ where: { id: unit.id }, data: { unitNumber: input.unitNumber, type: input.type, monthlyRent: input.monthlyRent, floor: input.floor || null, bedrooms: input.bedrooms ?? null, bathrooms: input.bathrooms ?? null } }),
    db.auditLog.create({ data: { organizationId: unit.property.organizationId, actorId: session.userId, action: "unit.updated", resourceType: "Unit", resourceId: unit.id, metadata: { propertyId: unit.propertyId } } }),
  ]);
  revalidatePath(`/app/properties/${unit.propertyId}`); revalidatePath("/app/units");
  redirect(`/app/properties/${unit.propertyId}`);
}

export async function createBuilding(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const input = buildingSchema.parse({ propertyId: formData.get("propertyId"), name: formData.get("name"), floors: formData.get("floors") || undefined });
  const property = await managedProperty(input.propertyId, session.organizationId);
  if (!property) throw new Error("Property not found in your organization.");
  const building = await db.building.create({ data: { propertyId: property.id, name: input.name, floors: input.floors ?? null } });
  await db.auditLog.create({ data: { organizationId: property.organizationId, actorId: session.userId, action: "building.created", resourceType: "Building", resourceId: building.id, metadata: { propertyId: property.id } } });
  revalidatePath(`/app/properties/${property.id}`);
  redirect(`/app/properties/${property.id}`);
}

export async function updateBuilding(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const buildingId = z.string().min(1).parse(formData.get("buildingId"));
  const input = buildingSchema.parse({ propertyId: formData.get("propertyId"), name: formData.get("name"), floors: formData.get("floors") || undefined });
  const building = await db.building.findFirst({ where: { id: buildingId, propertyId: input.propertyId, property: { ...(session.organizationId ? { organizationId: session.organizationId } : {}) } }, include: { property: true } });
  if (!building) throw new Error("Building not found in this property.");
  await db.$transaction([
    db.building.update({ where: { id: building.id }, data: { name: input.name, floors: input.floors ?? null } }),
    db.auditLog.create({ data: { organizationId: building.property.organizationId, actorId: session.userId, action: "building.updated", resourceType: "Building", resourceId: building.id, metadata: { propertyId: building.propertyId } } }),
  ]);
  revalidatePath(`/app/properties/${building.propertyId}`);
  redirect(`/app/properties/${building.propertyId}`);
}
