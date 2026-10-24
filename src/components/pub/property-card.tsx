"use client";

import Link from "next/link";
import { PubIcon, type PubIconName } from "@/components/icons";
import type { Listing } from "@/lib/demo-data";
import { groupedAmount, PROPERTY_TYPE_LABELS, UNIT_TYPE_LABELS } from "@/lib/listing-filters";
import { Skyline } from "./skyline";
import { useI18n } from "@/i18n/client";

const kindIcon = (kind?: string): PubIconName =>
  kind === "SHOP" ? "store" : kind === "OFFICE" ? "briefcase" : kind === "STORE" ? "warehouse" : kind === "APARTMENT" ? "building" : "home";

/** Listing photo with the skyline fallback (Laravel `x-pub.property-image`). */
export function PropertyImage({ imageId, alt, kind, eager = false, caption }: { imageId?: string; alt: string; kind?: string; eager?: boolean; caption?: string }) {
  const { t } = useI18n();
  if (!imageId) {
    caption ??= t("Photos coming soon");
    return (
      <div className="pub-photo-fallback" role="img" aria-label={caption}>
        <span className="pub-photo-fallback-skyline"><Skyline /></span>
        <span className="pub-photo-fallback-icon"><PubIcon name={kindIcon(kind)} /></span>
        <span className="pub-photo-fallback-text" aria-hidden="true">{caption}</span>
      </div>
    );
  }
  return (
    // Listing images are streamed through a private API route, so next/image optimization is not used.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/listing-images/${imageId}`}
      alt={alt}
      width={1200}
      height={800}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      className="pub-photo"
    />
  );
}

/** Public catalogue card (Laravel `x-pub.property-card`). */
export function PropertyCard({ listing }: { listing: Listing }) {
  const { t } = useI18n();
  const cover = listing.images?.[0];
  const unitLabel = listing.unitType ? t(UNIT_TYPE_LABELS[listing.unitType]) : listing.unit;
  const tags = [...new Set([listing.propertyType ? t(PROPERTY_TYPE_LABELS[listing.propertyType]) : listing.type, ...listing.features.slice(0, 3)].filter(Boolean))];

  return (
    <Link href={`/listings/${listing.id}`} className="pub-card">
      <div className="pub-card-media">
        <PropertyImage imageId={cover?.id} alt={cover?.altText ?? listing.title} kind={listing.unitType} />
        <div className="pub-card-badges">
          <span className="pub-badge"><span className="pub-badge-dot" aria-hidden="true" />{t("Available")}</span>
        </div>
      </div>
      <div className="pub-card-body">
        <p className="pub-card-type">{unitLabel}</p>
        <h3 className="pub-card-title">{listing.title}</h3>
        {listing.location && <p className="pub-card-place"><PubIcon name="map-pin" />{listing.location}</p>}
        {tags.length > 0 && (
          <ul className="pub-card-tags" aria-label={t("Highlights")}>
            {tags.map((tag) => <li key={tag} className="pub-card-tag">{tag}</li>)}
          </ul>
        )}
        <div className="pub-card-foot">
          {listing.monthly > 0 ? (
            <p className="pub-price">TZS {groupedAmount(listing.monthly)} <small>{t("/ month")}</small><span className="pub-price-label">{t("Indicative rent")}</span></p>
          ) : (
            <p className="pub-price">{t("Rent on enquiry")}<span className="pub-price-label">{t("Ask the property team")}</span></p>
          )}
          <span className="pub-card-cta" aria-hidden="true">{t("View")} <PubIcon name="arrow-right" size="sm" /></span>
        </div>
      </div>
    </Link>
  );
}
