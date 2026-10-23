"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { SnippePaymentGateway } from "./snippe";

const paymentSchema = z.object({
  obligationId: z.string().min(1),
  phone: z.string().trim().min(9).max(30),
});

export async function initiateLeasePayment(formData: FormData) {
  const session = await requireSession(["TENANT", "LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  const input = paymentSchema.parse({
    obligationId: formData.get("obligationId"),
    phone: formData.get("phone"),
  });

  const obligation = await db.paymentObligation.findUnique({
    where: { id: input.obligationId },
    include: {
      lease: {
        include: {
          tenant: true,
          unit: { include: { property: true } },
        },
      },
    },
  });
  if (!obligation) throw new Error("Payment obligation not found.");
  if (obligation.status === "PAID") throw new Error("This obligation is already paid.");
  if (obligation.status === "CANCELLED") throw new Error("This obligation is cancelled.");

  const organizationId = obligation.lease.unit.property.organizationId;
  if (session.organizationId && organizationId !== session.organizationId) {
    throw new Error("Payment obligation is outside your organization.");
  }
  if (session.role === "TENANT" && obligation.lease.tenant.userId !== session.userId) {
    throw new Error("Tenants can only pay their own lease obligations.");
  }

  const tenantEmail = obligation.lease.tenant.email;
  if (!tenantEmail) throw new Error("The tenant needs an email address before mobile money payment can start.");

  const gateway = new SnippePaymentGateway();
  const initiation = await gateway.initiatePayment(
    {
      internalReference: obligation.internalReference,
      amount: Number(obligation.amount),
      currency: "TZS",
      tenantName: obligation.lease.tenant.name,
      tenantEmail,
    },
    input.phone,
  );

  await db.$transaction(async (tx) => {
    await tx.paymentTransaction.upsert({
      where: { providerReference: initiation.providerReference },
      create: {
        obligationId: obligation.id,
        provider: gateway.code,
        providerReference: initiation.providerReference,
        requestedAmount: obligation.amount,
        currency: obligation.currency,
        status: "PENDING",
        rawPayload: {
          providerStatus: initiation.providerStatus,
          responseReference: initiation.rawResponseReference,
        },
      },
      update: {
        status: "PENDING",
        rawPayload: {
          providerStatus: initiation.providerStatus,
          responseReference: initiation.rawResponseReference,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId: session.userId,
        action: "payment.initiated",
        resourceType: "PaymentObligation",
        resourceId: obligation.id,
        metadata: {
          provider: gateway.code,
          providerReference: initiation.providerReference,
        },
      },
    });
  });

  revalidatePath("/app/payments");
  revalidatePath("/app/leases");
  return { status: "PENDING" as const, providerReference: initiation.providerReference };
}
