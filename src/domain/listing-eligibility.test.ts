import { describe, expect, it } from "vitest";
import { hasProtectedOccupancy, isPublicListingEligible } from "./listing-eligibility";

describe("public listing eligibility", () => {
  it("blocks every protected occupancy state", () => {
    for (const status of ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"]) {
      expect(hasProtectedOccupancy([{ status }])).toBe(true);
      expect(isPublicListingEligible({ listingStatus: "PUBLISHED", listingEnabled: true, leases: [{ status }] })).toBe(false);
    }
  });

  it("allows only published and enabled unprotected units", () => {
    expect(isPublicListingEligible({ listingStatus: "PUBLISHED", listingEnabled: true, leases: [{ status: "EXPIRED" }] })).toBe(true);
    expect(isPublicListingEligible({ listingStatus: "DRAFT", listingEnabled: true, leases: [] })).toBe(false);
    expect(isPublicListingEligible({ listingStatus: "PUBLISHED", listingEnabled: false, leases: [] })).toBe(false);
  });
});
