"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPrivateObjectStore } from "@/server/storage/private-object-store";

const schema = z.object({
  name: z.string().trim().min(2).max(255),
  postalAddress: z.string().trim().max(255).optional(),
  contactPhone: z.string().trim().max(32).optional(),
  contactEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  tin: z.string().trim().max(32).regex(/^[0-9A-Za-z][0-9A-Za-z\- ]{4,30}$/).optional().or(z.literal("")),
});

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function updateOrganizationBranding(formData: FormData) {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization workspace is required.");

  const input = schema.parse({
    name: formData.get("name"),
    postalAddress: formData.get("postalAddress") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    contactEmail: formData.get("contactEmail") ?? "",
    tin: formData.get("tin") ?? "",
  });

  const organization = await db.organization.findUnique({ where: { id: session.organizationId }, select: { settings: true } });
  if (!organization) throw new Error("Organization not found.");
  const previous = record(organization.settings);
  const previousBranding = record(previous.branding);

  await db.$transaction([
    db.organization.update({
      where: { id: session.organizationId },
      data: {
        name: input.name,
        settings: {
          ...previous,
          branding: {
            ...previousBranding,
            postalAddress: input.postalAddress ?? "",
            contactPhone: input.contactPhone ?? "",
            contactEmail: input.contactEmail || "",
            tin: input.tin || "",
          },
        },
      },
    }),
    db.auditLog.create({
      data: { organizationId: session.organizationId, actorId: session.userId, action: "organization.branding.updated", resourceType: "Organization", resourceId: session.organizationId },
    }),
  ]);
  revalidatePath("/app/organization");
}

export async function uploadOrganizationLogo(formData: FormData) {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization workspace is required.");
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a logo file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Logo must be 5 MB or smaller.");
  const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
  if (!allowed.has(file.type)) throw new Error("Logo must be PNG, JPEG, WEBP or SVG.");

  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "img";
  const key = `organizations/${session.organizationId}/branding/logo-${randomUUID()}.${extension}`;
  const store = getPrivateObjectStore();
  await store.put({ key, bytes: new Uint8Array(await file.arrayBuffer()), mimeType: file.type });

  const organization = await db.organization.findUnique({ where: { id: session.organizationId }, select: { settings: true } });
  if (!organization) throw new Error("Organization not found.");
  const settings = record(organization.settings);
  const branding = record(settings.branding);

  await db.$transaction([
    db.organization.update({ where: { id: session.organizationId }, data: { settings: { ...settings, branding: { ...branding, logoStorageKey: key, logoMimeType: file.type, logoFileName: file.name } } } }),
    db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, action: "organization.logo.updated", resourceType: "Organization", resourceId: session.organizationId, metadata: { mimeType: file.type, fileName: file.name } } }),
  ]);
  revalidatePath("/app/organization");
}
