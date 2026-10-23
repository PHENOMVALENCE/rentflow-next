import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/public-nav";
import { Status } from "@/components/ui";
import { getPublicListing } from "@/server/rentflow/public-listing-read-model";

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getPublicListing(id);
  if (!listing) notFound();

  const total = listing.monthly * listing.term;
  const [hero, ...gallery] = listing.images;

  return (
    <>
      <PublicNav />
      <main className="rf-container py-10">
        <Link href="/listings" className="text-sm text-[var(--muted-strong)]">← Back to properties</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="relative flex h-[440px] items-end overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#e2efed,#a8c9c4)] p-6">
              {hero && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/listing-images/${hero.id}`} alt={hero.altText ?? listing.title} className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="relative z-10"><Status>{listing.status}</Status></div>
            </div>

            {gallery.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {gallery.slice(0, 6).map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-2xl bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/listing-images/${image.id}`} alt={image.altText ?? listing.title} className="aspect-[4/3] h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8">
              <p className="rf-eyebrow">{listing.location} · {listing.type}</p>
              <h1 className="text-4xl font-semibold">{listing.title}</h1>
              <p className="mt-2 text-lg text-[var(--muted-strong)]">{listing.unit}</p>
              <p className="mt-6 max-w-2xl leading-7 text-[var(--muted-strong)]">{listing.description}</p>
              {listing.features.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{listing.features.map((feature) => <span key={feature} className="rf-chip">{feature}</span>)}</div>}
            </div>
          </div>

          <aside className="rf-card h-fit p-6 lg:sticky lg:top-24">
            <p className="text-xs text-[var(--muted)]">Indicative monthly rent</p>
            <p className="mt-1 text-3xl font-semibold">TZS {listing.monthly.toLocaleString()}</p>
            <div className="my-6 border-t border-[var(--border)]" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-[var(--muted)]">Lease option</p><p className="mt-1 font-medium">{listing.term} months</p></div>
              <div><p className="text-[var(--muted)]">Full-term amount</p><p className="mt-1 font-medium">TZS {total.toLocaleString()}</p></div>
            </div>
            <p className="mt-5 text-xs leading-5 text-[var(--muted)]">The full-term amount is authoritative for lease activation. Public pricing does not reserve the unit.</p>
            <Link href={`/listings/${listing.id}/inquire`} className="rf-button rf-button-dark mt-6 w-full">Request a viewing</Link>
          </aside>
        </div>
      </main>
    </>
  );
}
