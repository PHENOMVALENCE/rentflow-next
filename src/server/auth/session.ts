import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db, hasDatabaseConfiguration } from "@/server/db";

const COOKIE_NAME = "rentflow_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type SessionPayload = {
  userId: string;
  organizationId: string | null;
  role: Role;
  credentialTag?: string;
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value && hasDatabaseConfiguration()) throw new Error("AUTH_SECRET is required when persistence is enabled.");
  return value || "rentflow-demo-only-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function credentialTag(passwordHash: string | null) {
  return createHmac("sha256", secret()).update(`credential:${passwordHash ?? "UNSET"}`).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(input: Omit<SessionPayload, "exp" | "credentialTag">) {
  let tag: string | undefined;
  if (hasDatabaseConfiguration()) {
    const user = await db.user.findUnique({ where: { id: input.userId }, select: { passwordHash: true } });
    if (!user) throw new Error("Cannot create a session for an unknown user.");
    tag = credentialTag(user.passwordHash);
  }

  const jar = await cookies();
  jar.set(
    COOKIE_NAME,
    encode({ ...input, credentialTag: tag, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    },
  );
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  if (!hasDatabaseConfiguration()) {
    return { userId: "demo-user", organizationId: null, role: "PLATFORM_ADMIN", exp: Number.MAX_SAFE_INTEGER };
  }

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const payload = token ? decode(token) : null;
  if (!payload?.credentialTag) return null;

  const user = await db.user.findUnique({ where: { id: payload.userId }, select: { passwordHash: true } });
  if (!user) return null;
  const expectedTag = Buffer.from(credentialTag(user.passwordHash));
  const actualTag = Buffer.from(payload.credentialTag);
  if (expectedTag.length !== actualTag.length || !timingSafeEqual(expectedTag, actualTag)) return null;

  return payload;
}

export async function requireSession(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(session.role)) redirect("/app");
  return session;
}

export async function getSessionUser() {
  const session = await getSession();
  if (!session || !hasDatabaseConfiguration()) return null;
  return db.user.findUnique({ where: { id: session.userId } });
}
