import { db } from "@/server/db";
import { apiSession, isApiError, jsonData } from "@/server/api/v1";

// PropertyInquiry has no Prisma relation to its listing, so organization scope is
// resolved through the organization's listing ids before reading inquiries.
export async function GET() {
  const s = await apiSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (isApiError(s)) return s;

  let where = {};
  if (s.role !== "PLATFORM_ADMIN") {
    if (!s.organizationId) return jsonData({ data: [] });
    const listings = await db.propertyListing.findMany({
      where: { unit: { property: { organizationId: s.organizationId } } },
      select: { id: true },
    });
    where = { listingId: { in: listings.map((listing) => listing.id) } };
  }

  return jsonData({ data: await db.propertyInquiry.findMany({ where, orderBy: { createdAt: "desc" } }) });
}
