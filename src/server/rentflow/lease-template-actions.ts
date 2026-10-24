"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPrivateObjectStore } from "@/server/storage/private-object-store";

const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg"]);

export async function storeStandardLeaseTemplate(formData: FormData) {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization workspace is required.");
  const termMonths = z.coerce.number().int().refine((value) => value === 3 || value === 6).parse(formData.get("termMonths"));
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a lease template file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Lease template files must be 10 MB or smaller.");
  if (!allowedTypes.has(file.type)) throw new Error("Lease templates must be PDF, PNG or JPEG files.");

  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
  const key = `organizations/${session.organizationId}/lease-templates/${termMonths}m-${randomUUID()}.${extension}`;
  const store = getPrivateObjectStore();
  await store.put({ key, bytes: new Uint8Array(await file.arrayBuffer()), mimeType: file.type });

  await db.$transaction(async (tx) => {
    await tx.organizationLeaseTemplate.updateMany({
      where: { organizationId: session.organizationId!, name: { startsWith: `${termMonths}-month standard lease` }, active: true },
      data: { active: false },
    });
    const template = await tx.organizationLeaseTemplate.create({
      data: {
        organizationId: session.organizationId!,
        name: `${termMonths}-month standard lease · ${file.name}`,
        storageKey: key,
        active: true,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId!,
        actorId: session.userId,
        action: "lease_template.stored",
        resourceType: "OrganizationLeaseTemplate",
        resourceId: template.id,
        metadata: { termMonths, fileName: file.name, mimeType: file.type },
      },
    });
  });

  revalidatePath("/app/standard-leases");
}
