import { NextResponse } from "next/server";
import { getPublicListingImage } from "@/server/rentflow/listing-image-read-model";
import { getPrivateObjectStore, StorageConfigurationError } from "@/server/storage/private-object-store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await getPublicListingImage(id);
  if (!image) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const store = getPrivateObjectStore();
    if (store.provider === "LOCAL") {
      const bytes = await store.get(image.storageKey);
      return new Response(Buffer.from(bytes), {
        headers: {
          "Content-Type": "image/*",
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const url = await store.createDownloadUrl(image.storageKey, 300);
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new StorageConfigurationError("Image storage returned a non-HTTPS URL.");
    return NextResponse.redirect(parsed, { status: 307 });
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
    }
    console.error("listing_image_read_error", error);
    return NextResponse.json({ error: "image_read_failed" }, { status: 500 });
  }
}
