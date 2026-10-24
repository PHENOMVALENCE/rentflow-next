export class WhatsAppProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppProviderError";
  }
}

export type WhatsAppTemplateMessage = {
  event: string;
  locale: "sw" | "en";
  variables: string[];
};

const ENDPOINT = "https://karibu.briq.tz/v1/whatsapp/messages/template";

function normalizePhone(phone: string) {
  const normalized = phone.trim().replace(/^\+/, "");
  if (!/^255\d{9}$/.test(normalized)) throw new WhatsAppProviderError("Use a valid Tanzanian phone number.");
  return normalized;
}

export function briqWhatsAppTemplateName(event: string, locale: "sw" | "en") {
  const prefix = process.env.WHATSAPP_TEMPLATE_PREFIX?.trim() || "rentflow_";
  return `${prefix}${event}_${locale}`;
}

export async function sendBriqWhatsAppTemplate(phone: string, message: WhatsAppTemplateMessage) {
  const apiKey = process.env.BRIQ_API_KEY?.trim();
  if (!apiKey) throw new WhatsAppProviderError("Briq WhatsApp is not configured.");

  const variables = Object.fromEntries(message.variables.map((value, index) => [String(index + 1), value]));
  const payload: Record<string, unknown> = {
    to: normalizePhone(phone),
    template_name: briqWhatsAppTemplateName(message.event, message.locale),
    variables,
  };

  const sender = process.env.BRIQ_WHATSAPP_SENDER?.trim();
  if (sender) payload.sender = sender;

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(Number(process.env.WHATSAPP_TIMEOUT_MS || 15_000)),
      cache: "no-store",
    });
  } catch {
    throw new WhatsAppProviderError("Briq WhatsApp did not answer.");
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Response content is not persisted; only status/provider IDs should reach business records.
  }

  if (!response.ok) {
    const parsed = body as { errors?: Array<{ code?: string }>; code?: string } | null;
    const code = parsed?.errors?.[0]?.code ?? parsed?.code;
    throw new WhatsAppProviderError(`Briq WhatsApp returned HTTP ${response.status}${code ? ` (${code})` : ""}.`);
  }

  const parsed = body as { data?: { message_id?: string }; message_id?: string } | null;
  const providerMessageId = parsed?.data?.message_id ?? parsed?.message_id ?? null;
  return typeof providerMessageId === "string" && providerMessageId ? providerMessageId.slice(0, 100) : null;
}

export function isBriqWhatsAppConfigured() {
  return Boolean(process.env.BRIQ_API_KEY?.trim()) && (process.env.WHATSAPP_PROVIDER?.trim().toLowerCase() === "briq");
}
