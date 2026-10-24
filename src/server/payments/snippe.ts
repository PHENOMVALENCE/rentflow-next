import { createHmac, timingSafeEqual } from "node:crypto";
import {
  PaymentConfigurationError,
  PaymentGateway,
  PaymentInitiation,
  PaymentNotPayableError,
  PaymentObligationInput,
  ProviderEvent,
} from "./types";

const DEFAULT_BASE_URL = "https://api.snippe.sh";
const WEBHOOK_TOLERANCE_SECONDS = 300;

function normalizeTanzaniaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (/^0(6|7)\d{8}$/.test(digits)) return `255${digits.slice(1)}`;
  if (/^255(6|7)\d{8}$/.test(digits)) return digits;
  return null;
}

function splitCustomerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "Tenant";
  const last = parts.length > 1 ? parts.slice(1).join(" ") : first;
  return { first, last };
}

function assertWholeShillings(amount: number) {
  if (!Number.isSafeInteger(amount)) {
    throw new PaymentNotPayableError("Snippe collects whole Tanzanian shillings only.");
  }
  if (amount < 500) {
    throw new PaymentNotPayableError("Snippe cannot collect less than 500 TZS.");
  }
}

export class SnippePaymentGateway implements PaymentGateway {
  readonly code = "SNIPPE";

  private readonly baseUrl = (process.env.SNIPPE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  private readonly apiKey = process.env.SNIPPE_API_KEY?.trim() ?? "";
  private readonly webhookSecret = process.env.SNIPPE_WEBHOOK_SECRET?.trim() ?? "";
  private readonly webhookUrl = process.env.SNIPPE_WEBHOOK_URL?.trim() ?? "";

  async initiatePayment(input: PaymentObligationInput, payerPhone: string): Promise<PaymentInitiation> {
    if (!this.apiKey || !this.webhookUrl) {
      throw new PaymentConfigurationError("Snippe API key and webhook URL are required.");
    }
    if (!this.webhookUrl.startsWith("https://") || this.webhookUrl.length > 500) {
      throw new PaymentConfigurationError("SNIPPE_WEBHOOK_URL must be a public HTTPS URL.");
    }
    if (input.currency !== "TZS") {
      throw new PaymentNotPayableError("RentFlow Snippe payments must use TZS.");
    }
    assertWholeShillings(input.amount);

    const phone = normalizeTanzaniaPhone(payerPhone);
    if (!phone) {
      throw new PaymentNotPayableError("Enter a valid Tanzania mobile number.");
    }
    if (!/^\S+@\S+\.\S+$/.test(input.tenantEmail)) {
      throw new PaymentNotPayableError("The tenant needs a valid email address before payment can start.");
    }

    const { first, last } = splitCustomerName(input.tenantName);
    const response = await fetch(`${this.baseUrl}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": `rf-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        payment_type: "mobile",
        details: { amount: input.amount, currency: "TZS" },
        phone_number: phone,
        customer: { firstname: first, lastname: last, email: input.tenantEmail },
        webhook_url: this.webhookUrl,
        metadata: { internal_reference: input.internalReference },
      }),
      signal: AbortSignal.timeout(Number(process.env.SNIPPE_TIMEOUT_MS || 15_000)),
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: { reference?: string; status?: string } }
      | null;
    const reference = payload?.data?.reference?.trim();
    const status = payload?.data?.status?.trim();

    if (!response.ok || !reference || !status) {
      throw new PaymentNotPayableError("Snippe could not start this payment.");
    }

    return {
      providerReference: reference,
      providerStatus: status.toUpperCase(),
      rawResponseReference: `snippe:${reference}`,
    };
  }

  verifyWebhook(rawBody: string, signature: string | null, timestamp: string | null) {
    if (!this.webhookSecret || !signature || !timestamp || !/^\d+$/.test(timestamp)) return false;

    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (age > WEBHOOK_TOLERANCE_SECONDS) return false;

    const expected = createHmac("sha256", this.webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  paymentEvent(rawBody: string): ProviderEvent | null {
    const payload = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: {
        reference?: string;
        external_reference?: string;
        status?: string;
        amount?: { value?: number | string; currency?: string };
        metadata?: { internal_reference?: string };
      };
    };

    const type = payload.type ?? "";
    if (!type.startsWith("payment.")) return null;

    const value = Number(payload.data?.amount?.value);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new PaymentNotPayableError("Webhook amount is missing or invalid.");
    }

    const status =
      type === "payment.completed"
        ? "COMPLETED"
        : type === "payment.failed" || type === "payment.expired"
          ? "FAILED"
          : type === "payment.voided"
            ? "CANCELLED"
            : (payload.data?.status ?? "UNKNOWN").toUpperCase();

    return {
      internalReference: payload.data?.metadata?.internal_reference ?? "",
      providerReference: payload.data?.reference ?? "",
      receivedAmount: value,
      currency: payload.data?.amount?.currency ?? "",
      providerStatus: status,
      eventId: payload.id ?? null,
      controlNumber: payload.data?.external_reference ?? null,
    };
  }
}
