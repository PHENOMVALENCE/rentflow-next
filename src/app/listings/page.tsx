import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { Status } from "@/components/ui";
import { getPublicListings } from "@/server/rentflow/public-listing-read-model";

export default async function Listings() {
  const listings = await getPublicListings();

  return (
    <>
      <PublicNav />
      <main className="rf-container py-12">
        <p className="rf-eyebrow">Marketplace</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Available properties</h1>
            <p className="mt-2 text-[var(--muted-strong)]">Only units currently eligible for public listing are shown.</p>
          </div>
          <div className="rf-card flex gap-2 p-2"><span className="rf-filter-active">All</span><span className="rf-filter">Residential</span><span className="rf-filter">Commercial</span></div>
        </div>

        {listings.length === 0 ? (
          <div className="rf-card mt-8 p-8 text-center text-sm text-[var(--muted-strong)]">No units are currently available for public listing.</div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="rf-card overflow-hidden">
                <div className="relative flex h-56 items-end overflow-hidden bg-[linear-gradient(135deg,#e2efed,#b7d2ce)] p-5">
                  {listing.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/listing-images/${listing.images[0].id}`} alt={listing.images[0].altText ?? listing.title} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="relative z-10"><Status>{listing.status}</Status></div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-[var(--muted)]">{listing.location} · {listing.type}</p>
                  <h2 className="mt-1 text-xl font-semibold">{listing.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted-strong)]">{listing.unit} · {listing.bedrooms ? `${listing.bedrooms} bed · ` : ""}{listing.baths} bath</p>
                  <div className="mt-5 border-t border-[var(--border)] pt-4">
                    <p className="font-semibold">TZS {listing.monthly.toLocaleString()}</p>
                    <p className="text-xs text-[var(--muted)]">indicative monthly rent · {listing.term}-month option</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
