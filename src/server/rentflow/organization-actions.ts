"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const schema = z.object({
  name: z.string().trim().min(2).max(255),
  postalAddress: z.string().trim().max(255).optional(),
  contactPhone: z.string().trim().max(32).optional(),
  contactEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  tin: z.string().trim().max(32).regex(/^[0-9A-Za-z][0-9A-Za-z\- ]{4,30}$/).optional().or(z.literal("")),
});

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
  const previous = organization.settings && typeof organization.settings === "object" && !Array.isArray(organization.settings) ? organization.settings : {};

  await db.$transaction([
    db.organization.update({
      where: { id: session.organizationId },
      data: {
        name: input.name,
        settings: {
          ...previous,
          branding: {
            postalAddress: input.postalAddress ?? "",
            contactPhone: input.contactPhone ?? "",
            contactEmail: input.contactEmail || "",
            tin: input.tin || "",
          },
        },
      },
    }),
    db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "organization.branding.updated",
        resourceType: "Organization",
        resourceId: session.organizationId,
      },
    }),
  ]);

  revalidatePath("/app/organization");
}
