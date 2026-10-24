import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/public-nav";
import { getPublicListing } from "@/server/rentflow/read-model";
import { submitPropertyInquiry } from "@/server/rentflow/actions";

export default async function InquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; unavailable?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const listing = await getPublicListing(id);
  if (!listing) notFound();

  return (
    <>
      <PublicNav />
      <main className="rf-container py-12">
        <Link href={`/listings/${id}`} className="text-sm text-[var(--muted-strong)]">← Back to property</Link>
        <div className="mx-auto mt-8 max-w-2xl">
          <p className="rf-eyebrow">Property inquiry</p>
          <h1 className="text-4xl font-semibold">Request a viewing</h1>
          <p className="mt-2 text-[var(--muted-strong)]">{listing.title} · {listing.unit}</p>

          {query.submitted === "1" && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Your inquiry has been recorded. The property team can now follow up with you.</div>
          )}
          {query.unavailable === "1" && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Inquiry submission is disabled until the production database is connected.</div>
          )}

          <form action={submitPropertyInquiry} className="rf-card mt-6 space-y-5 p-6">
            <input type="hidden" name="listingId" value={listing.id} />
            <label className="block text-sm font-medium">Full name<input required name="name" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">Phone<input required name="phone" inputMode="tel" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" placeholder="0712 345 678" /></label>
              <label className="block text-sm font-medium">Email<input name="email" type="email" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>
            </div>
            <label className="block text-sm font-medium">Message<textarea name="message" rows={5} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" placeholder="Preferred viewing time or any questions..." /></label>
            <button className="rf-button rf-button-dark w-full" type="submit">Submit inquiry</button>
          </form>
        </div>
      </main>
    </>
  );
}
