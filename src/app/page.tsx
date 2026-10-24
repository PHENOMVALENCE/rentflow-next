import { HeroSearch } from "@/components/pub/hero-search";
import { ListingResults } from "@/components/pub/results";
import { HowItWorks, LandlordCta, PublicLayout } from "@/components/pub/sections";
import { applyListingQuery, countByUnitType, parseListingQuery, regionsOf } from "@/lib/listing-filters";
import { getSession } from "@/server/auth/session";
import { getPublicListings } from "@/server/rentflow/public-listing-read-model";

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [listings, params, session] = await Promise.all([getPublicListings(), searchParams, getSession()]);
  const query = parseListingQuery(params);
  const results = applyListingQuery(listings, query);

  return (
    <PublicLayout>
      <HeroSearch query={query} regions={regionsOf(listings)} total={results.length} availableTotal={listings.length} typeCounts={countByUnitType(listings)} />
      <ListingResults listings={results} query={query} signedIn={Boolean(session)} />
      <HowItWorks />
      <LandlordCta signedIn={Boolean(session)} />
    </PublicLayout>
  );
}
