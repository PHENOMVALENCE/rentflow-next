"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const schema = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(9).max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING_ATTACHMENT", "REFUSED"]).optional(),
});

export async function updateTenant(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const input = schema.parse({ tenantId: formData.get("tenantId"), name: formData.get("name"), phone: formData.get("phone"), email: formData.get("email") || "", status: formData.get("status") || undefined });
  const tenant = await db.tenant.findFirst({ where: { id: input.tenantId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) } });
  if (!tenant) throw new Error("Tenant not found in your organization.");
  await db.$transaction([
    db.tenant.update({ where: { id: tenant.id }, data: { name: input.name, phone: input.phone, email: input.email || null, status: input.status ?? tenant.status } }),
    db.auditLog.create({ data: { organizationId: tenant.organizationId, actorId: session.userId, action: "tenant.updated", resourceType: "Tenant", resourceId: tenant.id } }),
  ]);
  revalidatePath("/app/tenants"); revalidatePath(`/app/tenants/${tenant.id}`);
  redirect(`/app/tenants/${tenant.id}`);
}
