import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSession, type SessionPayload } from "@/server/auth/session";

export async function apiSession(roles?: Role[]): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if (roles && !roles.includes(session.role)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  return session;
}

export function isApiError(value: SessionPayload | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function orgWhere(session: SessionPayload) {
  return session.role === "PLATFORM_ADMIN" || !session.organizationId ? {} : { organizationId: session.organizationId };
}

export function jsonData(data: unknown, init?: ResponseInit) {
  return NextResponse.json(JSON.parse(JSON.stringify(data, (_key, value) => typeof value === "bigint" ? value.toString() : value)), init);
}

export function apiError(error: unknown) {
  console.error("api_v1_error", error);
  return NextResponse.json({ message: error instanceof Error ? error.message : "Request failed" }, { status: 422 });
}
