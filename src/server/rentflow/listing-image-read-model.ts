import type { SessionPayload } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

const protectedStatuses = ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;

export async function getManagedListingMedia(listingId: string, session: SessionPayload) {
  if (!hasDatabaseConfiguration()) return null;
  if (!session.organizationId && session.role !== "PLATFORM_ADMIN") return null;

  return db.propertyListing.findFirst({
    where: {
      id: listingId,
      ...(session.organizationId ? { unit: { property: { organizationId: session.organizationId } } } : {}),
    },
    include: {
      images: { orderBy: { position: "asc" } },
      unit: { include: { property: true } },
    },
  });
}

export async function getPublicListingImage(imageId: string) {
  if (!hasDatabaseConfiguration()) return null;

  const image = await db.listingImage.findUnique({
    where: { id: imageId },
    include: {
      listing: {
        include: {
          unit: { include: { leases: { select: { status: true } } } },
        },
      },
    },
  });
  if (!image || image.listing.status !== "PUBLISHED") return null;

  const protectedOccupancy = image.listing.unit.leases.some((lease) => protectedStatuses.includes(lease.status as (typeof protectedStatuses)[number]));
  if (protectedOccupancy) return null;

  return image;
}
