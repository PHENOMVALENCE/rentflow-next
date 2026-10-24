import type { Listing } from "@/lib/demo-data";

/** Public catalogue filters mirrored from the Laravel `Public\Home` component. */
export type ListingQuery = {
  region: string;
  property_type: string;
  unit_type: string;
  sort: "newest" | "price_asc" | "price_desc";
};

export const UNIT_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  SHOP: "Shop",
  OFFICE: "Office",
  STORE: "Store",
  OTHER: "Other space",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  MIXED_USE: "Mixed use",
};

export const SORT_LABELS: Record<ListingQuery["sort"], string> = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

const pick = (value: unknown) => (typeof value === "string" ? value.trim() : Array.isArray(value) && typeof value[0] === "string" ? value[0].trim() : "");

/** Normalizes untrusted query-string values; unknown values fall back to "no filter". */
export function parseListingQuery(params: Record<string, unknown>): ListingQuery {
  const propertyType = pick(params.property_type);
  const unitType = pick(params.unit_type);
  const sort = pick(params.sort);
  return {
    region: pick(params.region).slice(0, 80),
    property_type: propertyType in PROPERTY_TYPE_LABELS ? propertyType : "",
    unit_type: unitType in UNIT_TYPE_LABELS ? unitType : "",
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
  };
}

export function hasActiveFilters(query: ListingQuery) {
  return query.region !== "" || query.property_type !== "" || query.unit_type !== "";
}

/** Filters and sorts already-eligible public listings. Eligibility is decided upstream by the read model. */
export function applyListingQuery(listings: Listing[], query: ListingQuery): Listing[] {
  const filtered = listings.filter(
    (listing) =>
      (query.region === "" || listing.region === query.region) &&
      (query.property_type === "" || listing.propertyType === query.property_type) &&
      (query.unit_type === "" || listing.unitType === query.unit_type),
  );
  if (query.sort === "price_asc") return [...filtered].sort((a, b) => a.monthly - b.monthly);
  if (query.sort === "price_desc") return [...filtered].sort((a, b) => b.monthly - a.monthly);
  return filtered;
}

export function regionsOf(listings: Listing[]) {
  return [...new Set(listings.map((listing) => listing.region).filter((region): region is string => Boolean(region)))].sort();
}

export function countByUnitType(listings: Listing[]) {
  const counts: Record<string, number> = {};
  for (const listing of listings) if (listing.unitType) counts[listing.unitType] = (counts[listing.unitType] ?? 0) + 1;
  return counts;
}

/** Builds a home URL that keeps current filters, applies overrides and drops empty values. */
export function listingQueryHref(query: ListingQuery, overrides: Partial<ListingQuery> = {}) {
  const merged = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (merged.region) params.set("region", merged.region);
  if (merged.property_type) params.set("property_type", merged.property_type);
  if (merged.unit_type) params.set("unit_type", merged.unit_type);
  if (merged.sort !== "newest") params.set("sort", merged.sort);
  const search = params.toString();
  return `/${search ? `?${search}` : ""}#available-units`;
}

/** Groups digits like Laravel `DisplayMoney::grouped` (en-US separators, no decimals for whole amounts). */
export function groupedAmount(amount: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);
}
