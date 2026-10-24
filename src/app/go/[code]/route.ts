import { NextResponse } from "next/server";
import { db, hasDatabaseConfiguration } from "@/server/db";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!hasDatabaseConfiguration()) return NextResponse.json({ error: "persistence_not_configured" }, { status: 503 });
  const { code } = await params;
  if (!/^[A-Za-z0-9_-]{6,120}$/.test(code)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const link = await db.shortLink.findUnique({ where: { code } });
  if (!link || (link.expiresAt && link.expiresAt <= new Date()) || link.destination.startsWith("tenant-invite:")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const destination = link.destination.trim();
  if (!destination.startsWith("/") || destination.startsWith("//") || destination.includes("\\")) {
    return NextResponse.json({ error: "unsafe_destination" }, { status: 400 });
  }

  await db.shortLink.update({ where: { id: link.id }, data: { hits: { increment: 1 } } });
  return NextResponse.redirect(new URL(destination, request.url), { status: 302 });
}
