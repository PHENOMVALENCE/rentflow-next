"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const tenantSchema = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(9).max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
});

const leaseSchema = z.object({
  unitId: z.string().min(1),
  tenantId: z.string().min(1),
  termMonths: z.coerce.number().int().refine((value) => value === 3 || value === 6, "Lease term must be 3 or 6 months."),
  startDate: z.coerce.date(),
});

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export async function createTenant(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to create tenants.");

  const input = tenantSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
  });

  await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        organizationId: session.organizationId!,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "tenant.created",
        resourceType: "Tenant",
        resourceId: tenant.id,
      },
    });
  });

  revalidatePath("/app/tenants");
}

export async function createLease(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to create leases.");

  const input = leaseSchema.parse({
    unitId: formData.get("unitId"),
    tenantId: formData.get("tenantId"),
    termMonths: formData.get("termMonths"),
    startDate: formData.get("startDate"),
  });

  const [unit, tenant] = await Promise.all([
    db.unit.findFirst({ where: { id: input.unitId, property: { organizationId: session.organizationId } }, include: { leases: true } }),
    db.tenant.findFirst({ where: { id: input.tenantId, organizationId: session.organizationId } }),
  ]);
  if (!unit || !tenant) throw new Error("Unit or tenant not found in this organization.");
  if (unit.monthlyRent === null) throw new Error("The unit needs a monthly rent before a lease can be created.");
  if (unit.leases.some((lease) => ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status))) {
    throw new Error("This unit already has a protected lease relationship.");
  }

  const fullTermAmount = Number(unit.monthlyRent) * input.termMonths;
  const endDate = addMonths(input.startDate, input.termMonths);

  await db.$transaction(async (tx) => {
    const lease = await tx.lease.create({
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        termMonths: input.termMonths,
        startDate: input.startDate,
        endDate,
        fullTermAmount,
        currency: "TZS",
        status: "AWAITING_PAYMENT",
      },
    });

    const obligation = await tx.paymentObligation.create({
      data: {
        leaseId: lease.id,
        internalReference: `RF-${lease.id.toUpperCase()}`,
        amount: fullTermAmount,
        currency: "TZS",
        status: "PENDING",
        dueAt: input.startDate,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "lease.created",
        resourceType: "Lease",
        resourceId: lease.id,
        metadata: { obligationId: obligation.id, termMonths: input.termMonths, fullTermAmount },
      },
    });
  });

  revalidatePath("/app/leases");
  revalidatePath("/app/payments");
  revalidatePath("/app");
}
