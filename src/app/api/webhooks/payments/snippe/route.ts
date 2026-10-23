import { NextResponse } from "next/server";
import { reconcileProviderEvent } from "@/server/payments/reconcile";
import { SnippePaymentGateway } from "@/server/payments/snippe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");
  const gateway = new SnippePaymentGateway();

  if (!gateway.verifyWebhook(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  try {
    const event = gateway.paymentEvent(rawBody);
    if (!event) return NextResponse.json({ status: "accepted" });

    const result = await reconcileProviderEvent(event);
    return NextResponse.json({ status: "accepted", effect: result.effect });
  } catch (error) {
    console.error("snippe_webhook_error", error);
    return NextResponse.json({ error: "payment_reconciliation_failed" }, { status: 422 });
  }
}
