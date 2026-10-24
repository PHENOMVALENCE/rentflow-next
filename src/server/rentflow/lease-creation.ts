"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

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

export async function createLeaseWithListingGuard(formData: FormData): Promise<void> {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to create leases.");

  const input = leaseSchema.parse({
    unitId: formData.get("unitId"),
    tenantId: formData.get("tenantId"),
    termMonths: formData.get("termMonths"),
    startDate: formData.get("startDate"),
  });

  const [unit, tenant] = await Promise.all([
    db.unit.findFirst({
      where: { id: input.unitId, property: { organizationId: session.organizationId } },
      include: { leases: true, listing: true },
    }),
    db.tenant.findFirst({ where: { id: input.tenantId, organizationId: session.organizationId } }),
  ]);

  if (!unit || !tenant) throw new Error("Unit or tenant not found in this organization.");
  if (unit.monthlyRent === null) throw new Error("The unit needs a monthly rent before a lease can be created.");
  if (unit.leases.some((lease) => ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status))) {
    throw new Error("This unit already has a protected lease relationship.");
  }

  const fullTermAmount = Number(unit.monthlyRent) * input.termMonths;
  if (!Number.isSafeInteger(fullTermAmount) || fullTermAmount <= 0) throw new Error("Full-term amount must be a positive whole TZS value.");
  const endDate = addMonths(input.startDate, input.termMonths);

  const lease = await db.$transaction(async (tx) => {
    const created = await tx.lease.create({
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
        leaseId: created.id,
        internalReference: `RF-${created.id.toUpperCase()}`,
        amount: fullTermAmount,
        currency: "TZS",
        status: "PENDING",
        dueAt: input.startDate,
      },
    });

    if (unit.listing) {
      await tx.propertyListing.update({
        where: { id: unit.listing.id },
        data: {
          status: "BLOCKED",
          pausedAt: unit.listing.status === "PUBLISHED" ? new Date() : unit.listing.pausedAt,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "lease.created",
        resourceType: "Lease",
        resourceId: created.id,
        metadata: {
          obligationId: obligation.id,
          termMonths: input.termMonths,
          fullTermAmount,
          listingBlocked: Boolean(unit.listing),
        },
      },
    });

    return created;
  });

  revalidatePath("/app/leases");
  revalidatePath("/app/payments");
  revalidatePath("/app/listings");
  revalidatePath("/listings");
  revalidatePath("/app");
  redirect(`/app/leases/${lease.id}`);
}
