import { z } from "zod";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { apiError, jsonData } from "@/server/api/v1";

export async function POST(request: Request, { params }: { params: Promise<{ listing: string }> }) {
  if (!hasDatabaseConfiguration()) return jsonData({ message: "Service unavailable" }, { status: 503 });
  const { listing: listingId } = await params;
  try {
    const input = z.object({ name: z.string().trim().min(2).max(160), phone: z.string().trim().min(7).max(32), email: z.string().trim().email().max(255).optional().or(z.literal("")), message: z.string().trim().max(2000).optional().or(z.literal("")) }).parse(await request.json());
    const listing = await db.propertyListing.findFirst({ where: { id: listingId, status: "PUBLISHED", unit: { leases: { none: { status: { in: ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] } } } } } });
    if (!listing) return jsonData({ message: "Listing unavailable" }, { status: 404 });
    const inquiry = await db.propertyInquiry.create({ data: { listingId, name: input.name, phone: input.phone, email: input.email || null, message: input.message || null } });
    return jsonData({ data: inquiry }, { status: 201 });
  } catch (error) { return apiError(error); }
}
