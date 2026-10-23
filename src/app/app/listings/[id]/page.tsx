import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { uploadListingImageAction, removeListingImageAction } from "@/server/rentflow/listing-image-actions";
import { getManagedListingMedia } from "@/server/rentflow/listing-image-read-model";
import { hasPrivateObjectStorage } from "@/server/storage/private-object-store";

export default async function ListingMediaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; uploaded?: string; removed?: string }> }) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const { id } = await params;
  const query = await searchParams;
  const listing = await getManagedListingMedia(id, session);
  if (!listing) notFound();
  const storageReady = hasPrivateObjectStorage();

  return (
    <>
      <PageHeader eyebrow="Listings" title={listing.title} description={`${listing.unit.property.name} · Unit ${listing.unit.unitNumber}`} action={<Link href="/app/listings" className="rf-button rf-button-light">Back to listings</Link>} />

      {query.uploaded === "1" && <Message tone="success">Listing image uploaded.</Message>}
      {query.removed === "1" && <Message tone="success">Listing image removed.</Message>}
      {query.error === "storage" && <Message tone="error">Private object storage is not configured for this runtime.</Message>}
      {query.error === "image_type" && <Message tone="error">Use a JPEG, PNG or WebP image.</Message>}
      {query.error === "image_size" && <Message tone="error">Images must be 5 MB or smaller.</Message>}
      {query.error === "image_limit" && <Message tone="error">A listing can contain up to 10 images.</Message>}

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="rf-card p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Listing state</h2><Status>{listing.status}</Status></div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">{listing.description}</p>
          <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Images</dt><dd>{listing.images.length}/10</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Storage</dt><dd>{storageReady ? "Configured" : "Pending"}</dd></div>
          </dl>

          <form action={uploadListingImageAction} className="mt-6 space-y-4">
            <input type="hidden" name="listingId" value={listing.id} />
            <label className="block text-sm font-medium">Image<input required disabled={!storageReady} type="file" name="image" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm disabled:opacity-50" /></label>
            <label className="block text-sm font-medium">Alternative text<input disabled={!storageReady} name="altText" maxLength={180} placeholder="Describe the room or property view" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 disabled:bg-slate-50" /></label>
            <button disabled={!storageReady || listing.images.length >= 10} type="submit" className="rf-button rf-button-dark disabled:cursor-not-allowed disabled:opacity-50">Upload image</button>
          </form>
          {!storageReady && <p className="mt-3 text-xs leading-5 text-[var(--muted)]">The local adapter is development-only. A production private object-store adapter must be connected before image uploads are enabled on Vercel.</p>}
        </section>

        <section>
          <div className="mb-3"><h2 className="font-semibold">Listing gallery</h2><p className="mt-1 text-xs text-[var(--muted)]">Public image access is re-checked against listing publication and protected occupancy.</p></div>
          {listing.images.length === 0 ? <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No listing images uploaded.</div> : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listing.images.map((image) => (
                <article key={image.id} className="rf-card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/listing-images/${image.id}`} alt={image.altText ?? listing.title} className="aspect-[4/3] w-full object-cover" />
                  <div className="flex items-center justify-between gap-3 p-4"><div><p className="text-sm font-medium">Image {image.position + 1}</p><p className="mt-1 text-xs text-[var(--muted)]">{image.altText || "No alternative text"}</p></div><form action={removeListingImageAction}><input type="hidden" name="listingId" value={listing.id} /><input type="hidden" name="imageId" value={image.id} /><button className="rf-button rf-button-light" type="submit">Remove</button></form></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Message({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  const classes = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800";
  return <div className={`mb-5 rounded-xl border p-3 text-sm ${classes}`}>{children}</div>;
}
