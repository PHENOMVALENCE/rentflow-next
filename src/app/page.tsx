import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { getPublicListings } from "@/server/rentflow/public-listing-read-model";

export default async function HomePage() {
  const listings = await getPublicListings();
  const featured = listings[0] ?? null;

  return (
    <>
      <PublicNav />
      <main>
        <section className="rf-container py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <p className="rf-eyebrow">Rental operations · Tanzania</p>
              <h1 className="text-5xl font-semibold tracking-[-.04em] leading-[1.04] md:text-7xl">Find a place. Manage the whole lease.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted-strong)]">RentFlow connects public property discovery with lease, payment, maintenance and property operations in one authoritative workflow.</p>
              <div className="mt-8 flex gap-3"><Link className="rf-button rf-button-dark" href="/listings">Browse properties</Link><Link className="rf-button rf-button-light" href="/app">Open dashboard</Link></div>
            </div>

            <div className="relative min-h-[430px] overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0b1724,#145c65)] p-6 text-white shadow-2xl">
              {featured?.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/listing-images/${featured.images[0].id}`} alt={featured.images[0].altText ?? featured.title} className="absolute inset-0 h-full w-full object-cover opacity-50" />
              )}
              <div className="relative z-10 flex min-h-[382px] flex-col justify-end">
                <p className="text-sm text-white/60">{featured ? "Featured property" : "Rental operations"}</p>
                <p className="mt-2 text-3xl font-semibold">{featured?.title ?? "RentFlow"}</p>
                <p className="mt-2 text-white/70">{featured ? `${featured.location} · ${featured.unit}` : "Verified availability appears here when listings are published."}</p>
                {featured && <div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-white/60">Indicative monthly</p><p className="mt-1 text-xl font-semibold">TZS {featured.monthly.toLocaleString()}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-white/60">Lease option</p><p className="mt-1 text-xl font-semibold">{featured.term} months</p></div></div>}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-white">
          <div className="rf-container py-16">
            <div className="mb-8 flex items-end justify-between"><div><p className="rf-eyebrow">Available now</p><h2 className="text-3xl font-semibold">Properties ready to view</h2></div><Link href="/listings" className="text-sm font-medium">View all →</Link></div>
            {listings.length === 0 ? <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No properties are currently published and eligible for viewing.</div> : (
              <div className="grid gap-5 md:grid-cols-3">{listings.slice(0, 3).map((listing) => <Link href={`/listings/${listing.id}`} key={listing.id} className="rf-card group overflow-hidden"><div className="relative flex h-48 items-end overflow-hidden bg-[linear-gradient(135deg,#dbe9e8,#b7d2ce)] p-5">{listing.images[0] && <img src={`/api/listing-images/${listing.images[0].id}`} alt={listing.images[0].altText ?? listing.title} className="absolute inset-0 h-full w-full object-cover" />}<span className="rf-badge rf-badge-success relative z-10">{listing.status}</span></div><div className="p-5"><p className="text-xs text-[var(--muted)]">{listing.location}</p><h3 className="mt-1 text-lg font-semibold group-hover:text-[var(--brand)]">{listing.title}</h3><p className="mt-3 font-semibold">TZS {listing.monthly.toLocaleString()} <span className="text-xs font-normal text-[var(--muted)]">/ indicative month</span></p></div></Link>)}</div>
            )}
          </div>
        </section>

        <section id="how" className="rf-container py-16">
          <p className="rf-eyebrow">One source of truth</p>
          <h2 className="max-w-xl text-3xl font-semibold">Discovery, lease status and property operations stay connected.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">{["Discover verified availability","Review and activate a lease","Pay the exact lease obligation","Track maintenance and renewal"].map((item, index) => <div key={item} className="rf-card p-5"><span className="text-xs text-[var(--brand)]">0{index + 1}</span><p className="mt-4 font-medium">{item}</p></div>)}</div>
        </section>
      </main>
    </>
  );
}
