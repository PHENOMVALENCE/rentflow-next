const PROTECTED_LEASE_STATES = new Set(["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"]);

export function hasProtectedOccupancy(leases: Array<{ status: string }>) {
  return leases.some((lease) => PROTECTED_LEASE_STATES.has(lease.status));
}

export function isPublicListingEligible(input: {
  listingStatus: string;
  listingEnabled: boolean;
  leases: Array<{ status: string }>;
}) {
  return input.listingStatus === "PUBLISHED" && input.listingEnabled && !hasProtectedOccupancy(input.leases);
}
