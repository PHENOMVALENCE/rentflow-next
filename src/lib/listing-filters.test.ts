import { describe, expect, it } from "vitest";
import { listings } from "./demo-data";
import { applyListingQuery, countByUnitType, hasActiveFilters, listingQueryHref, parseListingQuery } from "./listing-filters";

describe("public listing filters", () => {
  it("ignores unknown filter and sort values", () => {
    const query = parseListingQuery({ property_type: "CASTLE", unit_type: ["SHOP"], sort: "random" });
    expect(query).toEqual({ region: "", property_type: "", unit_type: "SHOP", sort: "newest" });
    expect(hasActiveFilters(query)).toBe(true);
  });

  it("filters by unit type and sorts by price", () => {
    const apartments = applyListingQuery(listings, { ...parseListingQuery({}), unit_type: "APARTMENT", sort: "price_asc" });
    expect(apartments.map((listing) => listing.monthly)).toEqual([650000, 850000]);
    expect(countByUnitType(listings)).toEqual({ APARTMENT: 2, SHOP: 1 });
  });

  it("builds stable home URLs without empty parameters", () => {
    const query = parseListingQuery({ region: "Dar es Salaam" });
    expect(listingQueryHref(query, { unit_type: "SHOP" })).toBe("/?region=Dar+es+Salaam&unit_type=SHOP#available-units");
    expect(listingQueryHref(query, { region: "" })).toBe("/#available-units");
  });
});
