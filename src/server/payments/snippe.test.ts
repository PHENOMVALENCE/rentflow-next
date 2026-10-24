import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { SnippePaymentGateway } from "./snippe";

const originalSecret = process.env.SNIPPE_WEBHOOK_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.SNIPPE_WEBHOOK_SECRET;
  else process.env.SNIPPE_WEBHOOK_SECRET = originalSecret;
});

describe("SnippePaymentGateway", () => {
  it("accepts a fresh HMAC signed webhook", () => {
    process.env.SNIPPE_WEBHOOK_SECRET = "test-secret";
    const gateway = new SnippePaymentGateway();
    const body = JSON.stringify({ id: "evt_1", type: "payment.completed", data: {} });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac("sha256", "test-secret").update(`${timestamp}.${body}`).digest("hex");

    expect(gateway.verifyWebhook(body, signature, timestamp)).toBe(true);
  });

  it("rejects stale signatures", () => {
    process.env.SNIPPE_WEBHOOK_SECRET = "test-secret";
    const gateway = new SnippePaymentGateway();
    const body = "{}";
    const timestamp = String(Math.floor(Date.now() / 1000) - 301);
    const signature = createHmac("sha256", "test-secret").update(`${timestamp}.${body}`).digest("hex");

    expect(gateway.verifyWebhook(body, signature, timestamp)).toBe(false);
  });

  it("maps completed payment events and ignores payouts", () => {
    const gateway = new SnippePaymentGateway();
    const payment = gateway.paymentEvent(
      JSON.stringify({
        id: "evt_2",
        type: "payment.completed",
        data: {
          reference: "pay_1",
          amount: { value: 900000, currency: "TZS" },
          metadata: { internal_reference: "RF-001" },
        },
      }),
    );

    expect(payment).toMatchObject({
      internalReference: "RF-001",
      providerReference: "pay_1",
      receivedAmount: 900000,
      currency: "TZS",
      providerStatus: "COMPLETED",
    });
    expect(gateway.paymentEvent(JSON.stringify({ type: "payout.completed", data: {} }))).toBeNull();
  });
});
