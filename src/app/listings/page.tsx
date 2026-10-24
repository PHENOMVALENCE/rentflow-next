import { redirect } from "next/navigation";
import { listingQueryHref, parseListingQuery } from "@/lib/listing-filters";

// Laravel serves the public catalogue on the home page; /listings stays as a stable alias.
export default async function Listings({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  redirect(listingQueryHref(parseListingQuery(await searchParams)));
}
