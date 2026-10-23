import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "rentflow_pin_recovery";
const TTL_SECONDS = 10 * 60;

type RecoveryPayload = {
  phone: string;
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) throw new Error("AUTH_SECRET is required for PIN recovery.");
  return value;
}

function signature(body: string) {
  return createHmac("sha256", secret()).update(`pin-recovery:${body}`).digest("base64url");
}

function encode(payload: RecoveryPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body)}`;
}

function decode(value: string): RecoveryPayload | null {
  const [body, provided] = value.split(".");
  if (!body || !provided) return null;
  const expected = Buffer.from(signature(body));
  const actual = Buffer.from(provided);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as RecoveryPayload;
    if (!payload.phone || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createPinRecoveryState(phone: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encode({ phone, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/forgot-pin",
    maxAge: TTL_SECONDS,
  });
}

export async function getPinRecoveryState() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return token ? decode(token) : null;
}

export async function clearPinRecoveryState() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
