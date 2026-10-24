"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PubIcon } from "@/components/icons";
import { PropertyImage } from "./property-card";

type Photo = { id: string; altText: string | null };

const src = (photo: Photo) => `/api/listing-images/${photo.id}`;

/** Listing gallery: desktop mosaic, mobile swipe strip and a keyboard-friendly lightbox (Laravel `partials/gallery`). */
export function Gallery({ title, photos, kind }: { title: string; photos: Photo[]; kind?: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const trigger = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const count = photos.length;
  const tiles = photos.slice(0, 5);
  const hidden = count - tiles.length;
  const alt = (i: number) => photos[i]?.altText ?? `${title}${count > 1 ? `, photo ${i + 1} of ${count}` : ""}`;

  const openAt = (index: number, element: HTMLElement) => {
    trigger.current = element;
    setSelected(index);
    setOpen(true);
  };
  const close = useCallback(() => {
    setOpen(false);
    const element = trigger.current;
    setTimeout(() => element?.focus(), 0);
  }, []);
  const step = useCallback((delta: number) => setSelected((index) => (index + delta + count) % count), [count]);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  if (count === 0) {
    return (
      <div className="pub-gallery" aria-label="Photos">
        <div className="pub-gallery-empty"><PropertyImage alt={title} kind={kind} /></div>
      </div>
    );
  }

  return (
    <div className="pub-gallery" aria-label="Photos">
      <div className="pub-mosaic-wrap">
        <div className={`pub-mosaic pub-mosaic-${tiles.length}`}>
          {tiles.map((photo, index) => (
            <button key={photo.id} type="button" className="pub-mosaic-tile" onClick={(event) => openAt(index, event.currentTarget)} aria-label={`Open photo ${index + 1} of ${count}`}>
              <PropertyImage imageId={photo.id} alt={alt(index)} eager={index === 0} />
              {index === tiles.length - 1 && hidden > 0 && <span className="pub-mosaic-more" aria-hidden="true">+{hidden}</span>}
            </button>
          ))}
          {count > 1 && (
            <button type="button" className="pub-btn pub-btn-secondary pub-btn-sm pub-mosaic-all" onClick={(event) => openAt(0, event.currentTarget)}>
              <PubIcon name="images" /> Show all {count} photos
            </button>
          )}
        </div>
      </div>

      <div className="pub-swipe-wrap">
        <div className="pub-swipe" aria-label="Swipe through photos" tabIndex={0}>
          {photos.map((photo, index) => (
            <button key={photo.id} type="button" onClick={(event) => openAt(index, event.currentTarget)} aria-label={`Open photo ${index + 1} of ${count}`}>
              <PropertyImage imageId={photo.id} alt={alt(index)} eager={index === 0} />
            </button>
          ))}
        </div>
        {count > 1 && <span className="pub-badge pub-swipe-count" aria-hidden="true">{count} photos · swipe</span>}
      </div>

      {open && (
        <div className="pub-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="pub-lightbox-head">
            <p className="pub-small" aria-live="polite">{selected + 1} / {count}</p>
            <button ref={closeButton} type="button" className="pub-icon-button" onClick={close} aria-label="Close photo viewer"><PubIcon name="x" /></button>
          </div>
          <div className="pub-lightbox-stage">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(photos[selected])} alt={alt(selected)} />
            {count > 1 && (
              <>
                <button type="button" className="pub-lightbox-nav pub-lightbox-prev" onClick={() => step(-1)} aria-label="Previous photo"><PubIcon name="chevron-left" /></button>
                <button type="button" className="pub-lightbox-nav pub-lightbox-next" onClick={() => step(1)} aria-label="Next photo"><PubIcon name="chevron-right" /></button>
              </>
            )}
          </div>
          {count > 1 && (
            <div className="pub-lightbox-thumbs" role="group" aria-label="Choose a photo">
              {photos.map((photo, index) => (
                <button key={photo.id} type="button" className="pub-lightbox-thumb" onClick={() => setSelected(index)} aria-pressed={selected === index} aria-label={`View photo ${index + 1} of ${count}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src(photo)} alt="" loading="lazy" decoding="async" width={160} height={120} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
