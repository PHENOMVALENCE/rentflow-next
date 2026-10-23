export type OtpOperation = "request" | "resend" | "verify";

export class OtpProviderError extends Error {
  constructor(message = "SMS verification is unavailable. Please try again later.") {
    super(message);
    this.name = "OtpProviderError";
  }
}

type BriqOtpResponse = {
  success: boolean;
  status_code: number;
  data?: {
    remaining_attempts?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const ENDPOINT = "https://karibu.briq.tz/v1/otp";

function normalizePhone(phone: string) {
  const normalized = phone.trim().replace(/^\+/, "");
  if (!/^255\d{9}$/.test(normalized)) throw new OtpProviderError("Use a valid Tanzanian phone number.");
  return normalized;
}

function configuration() {
  const apiKey = process.env.BRIQ_API_KEY?.trim();
  if (!apiKey) throw new OtpProviderError();
  return {
    apiKey,
    senderId: process.env.BRIQ_SENDER_ID?.trim() || undefined,
  };
}

export async function callBriqOtp(operation: OtpOperation, phone: string, code?: string): Promise<BriqOtpResponse> {
  const { apiKey, senderId } = configuration();
  const payload: Record<string, unknown> = { phone_number: normalizePhone(phone) };

  if (operation === "verify") {
    if (!code || !/^\d{4}$/.test(code)) throw new OtpProviderError("Enter the 4-digit verification code.");
    payload.code = code;
  } else {
    payload.delivery_method = "sms";
    payload.otp_length = 4;
    payload.minutes_to_expire = 10;
    payload.message_template = "Your RentFlow verification code is {{code}}. It expires in 10 minutes.";
    if (senderId) payload.sender_id = senderId;
  }

  let response: Response;
  try {
    // Mutating OTP calls are intentionally never retried: retrying can invalidate a code already delivered.
    response = await fetch(`${ENDPOINT}/${operation}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new OtpProviderError("SMS verification is temporarily unavailable. Please try again later.");
  }

  let body: BriqOtpResponse;
  try {
    body = (await response.json()) as BriqOtpResponse;
  } catch {
    throw new OtpProviderError();
  }

  if (typeof body.success !== "boolean" || typeof body.status_code !== "number") throw new OtpProviderError();
  if (response.status >= 500 || [401, 403, 422].includes(response.status)) throw new OtpProviderError();

  if (body.success && response.ok && body.status_code === 200) return body;
  if (operation === "verify" && typeof body.data?.remaining_attempts === "number") return body;

  throw new OtpProviderError();
}

export function isBriqOtpConfigured() {
  return Boolean(process.env.BRIQ_API_KEY?.trim());
}
