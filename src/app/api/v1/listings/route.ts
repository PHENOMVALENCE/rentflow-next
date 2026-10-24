import { db, hasDatabaseConfiguration } from "@/server/db";
import { jsonData } from "@/server/api/v1";

export async function GET() {
  if (!hasDatabaseConfiguration()) return jsonData({ data: [] });
  const protectedStates = ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;
  const listings = await db.propertyListing.findMany({
    where: { status: "PUBLISHED", unit: { leases: { none: { status: { in: [...protectedStates] } } } } },
    include: { unit: { include: { property: true } }, images: { orderBy: { position: "asc" } } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return jsonData({ data: listings });
}
