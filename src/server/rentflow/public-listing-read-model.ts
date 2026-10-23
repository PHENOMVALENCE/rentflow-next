import { listings as demoListings, type Listing } from "@/lib/demo-data";
import { db, hasDatabaseConfiguration } from "@/server/db";

const protectedStates = ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"] as const;
const titleCase = (value: string) => value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export async function getPublicListings(): Promise<Listing[]> {
  if (!hasDatabaseConfiguration()) return demoListings;

  const rows = await db.propertyListing.findMany({
    where: {
      status: "PUBLISHED",
      unit: {
        listingEnabled: true,
        leases: { none: { status: { in: [...protectedStates] } } },
      },
    },
    include: {
      images: { orderBy: { position: "asc" }, select: { id: true, altText: true } },
      unit: {
        include: {
          property: true,
          leases: {
            where: { status: { in: ["DRAFT", "EXPIRED", "TERMINATED", "RENEWED"] } },
            orderBy: { endDate: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  return rows.map((listing) => ({
    id: listing.id,
    title: listing.title,
    location: [listing.unit.property.ward, listing.unit.property.district, listing.unit.property.region].filter(Boolean).join(", "),
    type: titleCase(listing.unit.property.type),
    unit: `${titleCase(listing.unit.type)} ${listing.unit.unitNumber}`,
    monthly: Number(listing.unit.monthlyRent ?? 0),
    term: listing.unit.leases[0]?.termMonths ?? 3,
    bedrooms: listing.unit.bedrooms ?? 0,
    baths: listing.unit.bathrooms ?? 0,
    status: "Available",
    description: listing.description,
    features: [],
    images: listing.images,
  }));
}

export async function getPublicListing(id: string): Promise<Listing | null> {
  const listings = await getPublicListings();
  return listings.find((listing) => listing.id === id) ?? null;
}
