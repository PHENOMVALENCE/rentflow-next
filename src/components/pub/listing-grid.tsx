"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { PubIcon } from "@/components/icons";
import type { Listing } from "@/lib/demo-data";
import { groupedAmount, PROPERTY_TYPE_LABELS, UNIT_TYPE_LABELS } from "@/lib/listing-filters";
import { PropertyCard, PropertyImage } from "./property-card";

/**
 * Results grid with the desktop quick-view drawer (Laravel `partials/quick-view`). On phones, with modifier
 * keys or without JavaScript, cards stay plain links to the listing page.
 */
export function ListingGrid({ listings }: { listings: Listing[] }) {
  const [preview, setPreview] = useState<Listing | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setPreview(null);
    const element = trigger.current;
    setTimeout(() => element?.focus({ preventScroll: true }), 0);
  }, []);

  useEffect(() => {
    if (!preview) return;
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [preview, close]);

  const intercept = (listing: Listing) => (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const link = (event.target as HTMLElement).closest("a");
    if (!link) return;
    event.preventDefault();
    trigger.current = link;
    setPreview(listing);
  };

  return (
    <>
      <div className="pub-grid pub-grid-fade">
        {listings.map((listing) => (
          <div key={listing.id} className="contents" onClickCapture={intercept(listing)}>
            <PropertyCard listing={listing} />
          </div>
        ))}
      </div>

      {preview && <QuickView listing={preview} onClose={close} closeRef={closeButton} />}
    </>
  );
}

function QuickView({ listing, onClose, closeRef }: { listing: Listing; onClose: () => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  const cover = listing.images?.[0];
  const facts = [
    ["Property type", listing.propertyType ? PROPERTY_TYPE_LABELS[listing.propertyType] : listing.type],
    ["Unit", listing.unit],
    ...(listing.bedrooms > 0 ? [["Bedrooms", String(listing.bedrooms)]] : []),
  ];
  return (
    <div className="pub-drawer-root">
      <div className="pub-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="pub-drawer" role="dialog" aria-modal="true" aria-labelledby="qv-title">
        <div className="pub-drawer-head">
          <p id="qv-title" className="pub-h4">Space preview</p>
          <button ref={closeRef} type="button" className="pub-icon-button" onClick={onClose} aria-label="Close preview"><PubIcon name="x" /></button>
        </div>
        <div className="pub-drawer-body">
          <div className="pub-drawer-media"><PropertyImage imageId={cover?.id} alt={cover?.altText ?? listing.title} kind={listing.unitType} eager /></div>
          <div className="pub-drawer-content">
            <div>
              <p className="pub-card-type">{listing.unitType ? UNIT_TYPE_LABELS[listing.unitType] : listing.unit}</p>
              <h3 className="pub-h3 mt-1">{listing.title}</h3>
              {listing.location && <p className="pub-card-place"><PubIcon name="map-pin" /> {listing.location}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {listing.monthly > 0 ? (
                <p className="pub-price">TZS {groupedAmount(listing.monthly)} <small>/ month</small><span className="pub-price-label">Indicative rent</span></p>
              ) : (
                <p className="pub-price">Rent on enquiry</p>
              )}
              <span className="pub-status"><span className="pub-badge-dot" aria-hidden="true" />Available now</span>
            </div>
            <dl className="pub-dl">
              {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            {listing.features.length > 0 && (
              <div>
                <h4 className="pub-label">Features</h4>
                <ul className="pub-card-tags">{listing.features.map((feature) => <li key={feature} className="pub-card-tag">{feature}</li>)}</ul>
              </div>
            )}
            {listing.description && <p className="pub-muted">{listing.description.length > 240 ? `${listing.description.slice(0, 239)}…` : listing.description}</p>}
          </div>
        </div>
        <div className="pub-drawer-foot">
          <Link href={`/listings/${listing.id}#enquire`} className="pub-btn pub-btn-primary pub-btn-lg"><PubIcon name="message" /> Contact property team</Link>
          <Link href={`/listings/${listing.id}`} className="pub-btn pub-btn-secondary pub-btn-lg">View full details <PubIcon name="arrow-right" className="pub-btn-arrow" /></Link>
        </div>
      </aside>
    </div>
  );
}
