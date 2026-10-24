"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createRenewalPlan } from "@/domain/renewal";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";

const renewalSchema = z.object({
  predecessorLeaseId: z.string().min(1),
  termMonths: z.coerce.number().int(),
});

export async function createLeaseRenewal(formData: FormData): Promise<void> {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!session.organizationId) throw new Error("An organization is required to renew leases.");

  const input = renewalSchema.parse({
    predecessorLeaseId: formData.get("predecessorLeaseId"),
    termMonths: formData.get("termMonths"),
  });

  const predecessor = await db.lease.findFirst({
    where: {
      id: input.predecessorLeaseId,
      unit: { property: { organizationId: session.organizationId } },
    },
    include: {
      unit: { include: { listing: true, leases: true } },
      tenant: true,
      successor: true,
    },
  });
  if (!predecessor) throw new Error("Lease not found in this organization.");
  if (predecessor.unit.monthlyRent === null) throw new Error("The unit requires a monthly rent before renewal.");

  const existingSuccessor = predecessor.successor.find((lease) => !["TERMINATED", "EXPIRED"].includes(lease.status));
  if (existingSuccessor) {
    redirect(`/app/leases/${existingSuccessor.id}`);
  }

  const conflictingLease = predecessor.unit.leases.find((lease) =>
    lease.id !== predecessor.id
      && lease.predecessorLeaseId !== predecessor.id
      && ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status),
  );
  if (conflictingLease) throw new Error("This unit already has another protected lease relationship.");

  const plan = createRenewalPlan({
    predecessorLeaseId: predecessor.id,
    predecessorStatus: predecessor.status,
    predecessorEndDate: predecessor.endDate,
    termMonths: input.termMonths,
    monthlyRent: Number(predecessor.unit.monthlyRent),
  });

  const successor = await db.$transaction(async (tx) => {
    const created = await tx.lease.create({
      data: {
        unitId: predecessor.unitId,
        tenantId: predecessor.tenantId,
        predecessorLeaseId: predecessor.id,
        termMonths: plan.termMonths,
        startDate: plan.startDate,
        endDate: plan.endDate,
        fullTermAmount: plan.fullTermAmount,
        currency: "TZS",
        status: "AWAITING_PAYMENT",
      },
    });

    const obligation = await tx.paymentObligation.create({
      data: {
        leaseId: created.id,
        internalReference: `RF-${created.id.toUpperCase()}`,
        amount: plan.fullTermAmount,
        currency: "TZS",
        status: "PENDING",
        dueAt: plan.startDate,
      },
    });

    if (predecessor.unit.listing) {
      await tx.propertyListing.update({
        where: { id: predecessor.unit.listing.id },
        data: {
          status: "BLOCKED",
          pausedAt: predecessor.unit.listing.status === "PUBLISHED" ? new Date() : predecessor.unit.listing.pausedAt,
        },
      });
    }

    await tx.notification.createMany({
      data: [
        ...(predecessor.tenant.userId
          ? [{
              userId: predecessor.tenant.userId,
              channel: "IN_APP",
              subject: "Lease renewal payment created",
              body: `Your ${plan.termMonths}-month renewal is awaiting exact full-term payment of TZS ${plan.fullTermAmount.toLocaleString("en-TZ")}.`,
              status: "PENDING" as const,
              metadata: { predecessorLeaseId: predecessor.id, successorLeaseId: created.id, obligationId: obligation.id },
            }]
          : []),
        {
          userId: session.userId,
          channel: "IN_APP",
          subject: "Lease renewal created",
          body: `Renewal for ${predecessor.tenant.name} is awaiting payment.`,
          status: "PENDING" as const,
          metadata: { predecessorLeaseId: predecessor.id, successorLeaseId: created.id, obligationId: obligation.id },
        },
      ],
      skipDuplicates: false,
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "lease.renewal_created",
        resourceType: "Lease",
        resourceId: created.id,
        metadata: {
          predecessorLeaseId: predecessor.id,
          obligationId: obligation.id,
          termMonths: plan.termMonths,
          fullTermAmount: plan.fullTermAmount,
          listingBlocked: Boolean(predecessor.unit.listing),
        },
      },
    });

    return created;
  });

  revalidatePath(`/app/leases/${predecessor.id}`);
  revalidatePath(`/app/leases/${successor.id}`);
  revalidatePath("/app/leases");
  revalidatePath("/app/payments");
  revalidatePath("/app/listings");
  revalidatePath("/listings");
  revalidatePath("/app/notifications");
  redirect(`/app/leases/${successor.id}`);
}
