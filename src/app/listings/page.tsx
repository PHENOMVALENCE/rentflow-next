import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { Status } from "@/components/ui";
import { getPublicListings } from "@/server/rentflow/read-model";

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
          <div className="rf-card flex gap-2 p-2"><button className="rf-filter-active">All</button><button className="rf-filter">Residential</button><button className="rf-filter">Commercial</button></div>
        </div>

        {listings.length === 0 ? (
          <div className="rf-card mt-8 p-8 text-center text-sm text-[var(--muted-strong)]">No units are currently available for public listing.</div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="rf-card overflow-hidden">
                <div className="flex h-56 items-end bg-[linear-gradient(135deg,#e2efed,#b7d2ce)] p-5"><Status>{listing.status}</Status></div>
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
