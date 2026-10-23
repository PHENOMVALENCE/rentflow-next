"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { getPrivateObjectStore, StorageConfigurationError } from "@/server/storage/private-object-store";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

async function managedListing(listingId: string, organizationId: string | null) {
  return db.propertyListing.findFirst({
    where: {
      id: listingId,
      ...(organizationId ? { unit: { property: { organizationId } } } : {}),
    },
    include: { images: { orderBy: { position: "asc" } } },
  });
}

export async function uploadListingImageAction(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const listingId = z.string().cuid().parse(formData.get("listingId"));
  const altText = z.string().trim().max(180).parse(formData.get("altText") ?? "");
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) redirect(`/app/listings/${listingId}?error=image_required`);
  if (file.size > MAX_IMAGE_BYTES) redirect(`/app/listings/${listingId}?error=image_size`);

  const extension = imageTypes.get(file.type);
  if (!extension) redirect(`/app/listings/${listingId}?error=image_type`);

  const listing = await managedListing(listingId, session.organizationId);
  if (!listing) redirect("/app/listings?error=listing_not_found");
  if (listing.images.length >= 10) redirect(`/app/listings/${listing.id}?error=image_limit`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const storageKey = `listings/${listing.id}/${randomUUID()}.${extension}`;
  const store = getPrivateObjectStore();

  try {
    await store.put({ key: storageKey, bytes, mimeType: file.type });
  } catch (error) {
    if (error instanceof StorageConfigurationError) redirect(`/app/listings/${listing.id}?error=storage`);
    throw error;
  }

  try {
    const image = await db.listingImage.create({
      data: {
        listingId: listing.id,
        storageKey,
        altText: altText || null,
        position: listing.images.length,
      },
    });
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "listing.image_uploaded",
        resourceType: "ListingImage",
        resourceId: image.id,
        metadata: { listingId: listing.id, sizeBytes: file.size, mimeType: file.type, checksum },
      },
    });
  } catch (error) {
    await store.delete(storageKey).catch(() => undefined);
    throw error;
  }

  revalidatePath(`/app/listings/${listing.id}`);
  revalidatePath(`/listings/${listing.id}`);
  redirect(`/app/listings/${listing.id}?uploaded=1`);
}

export async function removeListingImageAction(formData: FormData) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const listingId = z.string().cuid().parse(formData.get("listingId"));
  const imageId = z.string().cuid().parse(formData.get("imageId"));

  const listing = await managedListing(listingId, session.organizationId);
  const image = listing?.images.find((item) => item.id === imageId);
  if (!listing || !image) redirect("/app/listings?error=image_not_found");

  await db.$transaction([
    db.listingImage.delete({ where: { id: image.id } }),
    db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        action: "listing.image_removed",
        resourceType: "ListingImage",
        resourceId: image.id,
        metadata: { listingId: listing.id },
      },
    }),
  ]);

  try {
    await getPrivateObjectStore().delete(image.storageKey);
  } catch {
    // The database is authoritative. Object cleanup can be retried operationally.
  }

  revalidatePath(`/app/listings/${listing.id}`);
  revalidatePath(`/listings/${listing.id}`);
  redirect(`/app/listings/${listing.id}?removed=1`);
}
