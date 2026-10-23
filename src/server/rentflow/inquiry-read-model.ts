import { db, hasDatabaseConfiguration } from "@/server/db";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export async function getInquiryQueue(organizationId: string | null) {
  if (!hasDatabaseConfiguration()) {
    return [
      {
        id: "preview-inquiry",
        name: "Preview applicant",
        phone: "0712 345 678",
        email: "preview@example.com",
        status: "NEW",
        listingTitle: "Mbezi Garden · B4",
        createdAt: "Preview",
        prospectId: null,
      },
    ];
  }

  const listings = await db.propertyListing.findMany({
    where: organizationId ? { unit: { property: { organizationId } } } : undefined,
    select: { id: true, title: true },
  });
  const listingMap = new Map(listings.map((listing) => [listing.id, listing.title]));
  const listingIds = [...listingMap.keys()];
  if (organizationId && listingIds.length === 0) return [];

  const inquiries = await db.propertyInquiry.findMany({
    where: organizationId ? { listingId: { in: listingIds } } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return inquiries.map((inquiry) => ({
    id: inquiry.id,
    name: inquiry.name,
    phone: inquiry.phone,
    email: inquiry.email,
    status: inquiry.status,
    listingTitle: inquiry.listingId ? listingMap.get(inquiry.listingId) ?? "Listing unavailable" : "Direct inquiry",
    createdAt: date.format(inquiry.createdAt),
    prospectId: inquiry.prospectId,
  }));
}

export async function getInquiryDetail(id: string, organizationId: string | null) {
  if (!hasDatabaseConfiguration()) return null;

  const inquiry = await db.propertyInquiry.findUnique({ where: { id } });
  if (!inquiry) return null;

  let listing: {
    id: string;
    title: string;
    unit: { unitNumber: string; property: { id: string; name: string; organizationId: string } };
  } | null = null;

  if (inquiry.listingId) {
    listing = await db.propertyListing.findFirst({
      where: {
        id: inquiry.listingId,
        ...(organizationId ? { unit: { property: { organizationId } } } : {}),
      },
      select: {
        id: true,
        title: true,
        unit: { select: { unitNumber: true, property: { select: { id: true, name: true, organizationId: true } } } },
      },
    });
    if (!listing) return null;
  } else if (organizationId) {
    return null;
  }

  const prospect = inquiry.prospectId
    ? await db.prospect.findFirst({
        where: { id: inquiry.prospectId, ...(organizationId ? { organizationId } : {}) },
      })
    : null;

  return {
    id: inquiry.id,
    name: inquiry.name,
    phone: inquiry.phone,
    email: inquiry.email,
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    listing,
    prospect: prospect
      ? {
          id: prospect.id,
          status: prospect.status,
          source: prospect.source,
          createdAt: prospect.createdAt,
        }
      : null,
  };
}
