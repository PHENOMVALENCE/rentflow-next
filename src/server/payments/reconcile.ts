import { db } from "@/server/db";
import { reconcileExactPayment } from "@/domain/rentflow";
import type { ProviderEvent } from "./types";

function receiptNumber(reference: string) {
  return `RF-${reference.replace(/[^a-zA-Z0-9]/g, "").slice(-12).toUpperCase()}`;
}

export async function reconcileProviderEvent(event: ProviderEvent) {
  if (!event.internalReference || !event.providerReference) {
    throw new Error("Payment event references are required.");
  }

  return db.$transaction(async (tx) => {
    if (event.eventId) {
      const duplicate = await tx.paymentTransaction.findUnique({ where: { eventId: event.eventId } });
      if (duplicate) return { effect: "NOOP" as const, transactionId: duplicate.id };
    }

    const obligation = await tx.paymentObligation.findUnique({
      where: { internalReference: event.internalReference },
      include: { lease: true },
    });
    if (!obligation) throw new Error("Payment obligation not found.");

    const exact = reconcileExactPayment({
      required: Number(obligation.amount),
      received: event.receivedAmount,
      expectedCurrency: obligation.currency,
      receivedCurrency: event.currency,
      alreadyPaid: obligation.status === "PAID",
    });

    if (exact.effect === "NOOP") return { effect: "NOOP" as const };

    const isCompleted = event.providerStatus === "COMPLETED";
    const status = !isCompleted ? "FAILED" : exact.effect === "MARK_PAID" ? "SUCCEEDED" : "EXCEPTION";

    const transaction = await tx.paymentTransaction.create({
      data: {
        obligationId: obligation.id,
        provider: "SNIPPE",
        providerReference: event.providerReference,
        eventId: event.eventId,
        requestedAmount: obligation.amount,
        receivedAmount: event.receivedAmount,
        currency: event.currency || obligation.currency,
        status,
        rawPayload: {
          providerStatus: event.providerStatus,
          controlNumber: event.controlNumber,
        },
        failureReason: isCompleted && exact.effect === "EXCEPTION" ? "AMOUNT_OR_CURRENCY_MISMATCH" : null,
      },
    });

    if (!isCompleted) {
      await tx.auditLog.create({
        data: {
          action: "payment.failed",
          resourceType: "PaymentObligation",
          resourceId: obligation.id,
          metadata: { providerReference: event.providerReference, providerStatus: event.providerStatus },
        },
      });
      return { effect: "FAILED" as const, transactionId: transaction.id };
    }

    if (exact.effect === "EXCEPTION") {
      await tx.paymentObligation.update({ where: { id: obligation.id }, data: { status: "EXCEPTION" } });
      await tx.auditLog.create({
        data: {
          action: "payment.exception",
          resourceType: "PaymentObligation",
          resourceId: obligation.id,
          metadata: { receivedAmount: event.receivedAmount, currency: event.currency },
        },
      });
      return { effect: "EXCEPTION" as const, transactionId: transaction.id };
    }

    await tx.paymentObligation.update({
      where: { id: obligation.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await tx.lease.update({
      where: { id: obligation.leaseId },
      data: { status: "ACTIVE", activatedAt: obligation.lease.activatedAt ?? new Date() },
    });

    await tx.receipt.upsert({
      where: { obligationId: obligation.id },
      create: {
        obligationId: obligation.id,
        receiptNo: receiptNumber(event.providerReference),
        amount: obligation.amount,
        currency: obligation.currency,
      },
      update: {},
    });

    await tx.auditLog.create({
      data: {
        action: "payment.completed",
        resourceType: "Lease",
        resourceId: obligation.leaseId,
        metadata: { providerReference: event.providerReference, obligationId: obligation.id },
      },
    });

    return { effect: "MARK_PAID" as const, transactionId: transaction.id };
  });
}
