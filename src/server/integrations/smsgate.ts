import { normalizeTanzaniaPhone } from "@/server/auth/phone";

export class SmsDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmsDeliveryError";
  }
}

function configuration() {
  const url = process.env.SMSGATE_URL?.trim();
  const username = process.env.SMSGATE_USERNAME?.trim();
  const password = process.env.SMSGATE_PASSWORD?.trim();
  if (!url || !username || !password) throw new SmsDeliveryError("SMSGate is not configured.");
  return { url, username, password };
}

export function isSmsGateConfigured() {
  return Boolean(process.env.SMSGATE_URL?.trim() && process.env.SMSGATE_USERNAME?.trim() && process.env.SMSGATE_PASSWORD?.trim());
}

export function isAllowedSmsTestRecipient(phone: string) {
  const allowList = (process.env.SMS_TEST_RECIPIENTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        return normalizeTanzaniaPhone(entry);
      } catch {
        return null;
      }
    })
    .filter((entry): entry is string => Boolean(entry));

  return allowList.includes(normalizeTanzaniaPhone(phone));
}

export async function sendSmsGateMessage(phone: string, body: string) {
  if (process.env.NODE_ENV === "production") {
    throw new SmsDeliveryError("SMSGate is a test transport and is disabled in production.");
  }
  if (!isAllowedSmsTestRecipient(phone)) {
    throw new SmsDeliveryError("Recipient is not present in SMS_TEST_RECIPIENTS.");
  }
  if (!body.trim() || body.length > 1000) throw new SmsDeliveryError("SMS body is invalid.");

  const { url, username, password } = configuration();
  const normalized = normalizeTanzaniaPhone(phone);
  const basic = Buffer.from(`${username}:${password}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify({
        textMessage: { text: body },
        phoneNumbers: [`+${normalized}`],
      }),
      signal: AbortSignal.timeout(Number(process.env.SMSGATE_TIMEOUT_MS || 10_000)),
      cache: "no-store",
    });
  } catch {
    throw new SmsDeliveryError("SMSGate did not answer.");
  }

  if (!response.ok) throw new SmsDeliveryError(`SMSGate returned HTTP ${response.status}.`);

  try {
    const payload = (await response.json()) as { id?: unknown };
    return typeof payload.id === "string" && payload.id ? payload.id.slice(0, 100) : null;
  } catch {
    return null;
  }
}
