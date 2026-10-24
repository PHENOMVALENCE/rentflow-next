"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { PubIcon } from "@/components/icons";
import { listingQueryHref, PROPERTY_TYPE_LABELS, UNIT_TYPE_LABELS, type ListingQuery } from "@/lib/listing-filters";

type Props = {
  query: ListingQuery;
  regions: string[];
  total: number;
  availableTotal: number;
  typeCounts: Record<string, number>;
};

const quickTypes = [
  ["APARTMENT", "Apartments"],
  ["SHOP", "Shops"],
  ["OFFICE", "Offices"],
] as const;

const spaces = (n: number) => (n === 1 ? "1 space" : `${n} spaces`);

/** Discovery hero with progressive filters (Laravel `livewire.public.partials.hero-search`). */
export function HeroSearch({ query, regions, total, availableTotal, typeCounts }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [sheet, setSheet] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [pending, startTransition] = useTransition();
  const filtersActive = query.region !== "" || query.property_type !== "" || query.unit_type !== "";
  const extraFilters = Number(query.property_type !== "") + Number(query.unit_type !== "");

  useEffect(() => {
    // Mirrors Laravel's x-init: only collapse extra filters into a sheet once JS is running.
    const frame = requestAnimationFrame(() => setEnhanced(true));
    const hero = heroRef.current;
    let observer: IntersectionObserver | undefined;
    if (hero && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => hero.classList.toggle("is-offscreen", !entry.isIntersecting));
      observer.observe(hero);
    }
    const onResize = () => window.innerWidth >= 640 && setSheet(false);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const current = (): ListingQuery => {
    const data = new FormData(formRef.current ?? undefined);
    return { ...query, region: String(data.get("region") ?? ""), property_type: String(data.get("property_type") ?? ""), unit_type: String(data.get("unit_type") ?? "") };
  };

  const update = (next: ListingQuery) => startTransition(() => router.replace(listingQueryHref(next).replace("#available-units", ""), { scroll: false }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSheet(false);
    startTransition(() => router.replace(listingQueryHref(current()).replace("#available-units", ""), { scroll: false }));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("available-units")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => document.getElementById("available-title")?.focus({ preventScroll: true }), 400);
  };

  return (
    <section ref={heroRef} className="pub-hero" aria-labelledby="discovery-title" data-pub-hero>
      <div className="pub-hero-ambient" aria-hidden="true" />
      <div className="pub-hero-skyline" aria-hidden="true">
        <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax slice" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M0 160V118h60v-30h44v30h28V70h70v90M202 160V96h40V60h64v100M306 160V108h52V40h86v120M444 160V88h34V66h58v94M536 160V120h46V24h92v136M674 160V98h40V74h70v86M784 160V56h78v104M862 160V112h38V84h64v76M964 160V46h70v114M1034 160V102h56V76h52v84M1142 160V114h58v46" />
        </svg>
      </div>

      <div className="pub-container pub-hero-inner">
        <div className="pub-hero-copy">
          <h1 id="discovery-title" className="pub-hero-title">
            <span className="pub-line"><span>Find a space</span></span> <span className="pub-line"><span>that feels right.</span></span>
          </h1>
          <p className="pub-hero-lede pub-anim-rise">Discover apartments, shops and offices currently available across Tanzania, and enquire directly with the property team.</p>
        </div>

        {/* Mood photography, not a listing: decorative, so empty alt text. */}
        <div className="pub-hero-visual" aria-hidden="true">
          <figure className="pub-hero-photo pub-hero-photo-main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero/tower-1200.jpg" srcSet="/images/hero/tower-700.jpg 700w, /images/hero/tower-1200.jpg 1200w" sizes="(min-width: 1024px) 26rem, 60vw" width={1200} height={1200} alt="" fetchPriority="high" decoding="async" />
          </figure>
          <figure className="pub-hero-photo pub-hero-photo-inset">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero/interior-900.jpg" srcSet="/images/hero/interior-560.jpg 560w, /images/hero/interior-900.jpg 900w" sizes="(min-width: 1024px) 15rem, 40vw" width={900} height={1350} alt="" decoding="async" />
          </figure>
          {availableTotal > 0 && (
            <div className="pub-hero-chip">
              <span className="pub-hero-chip-icon"><PubIcon name="building" /></span>
              <span>
                <small>Available now</small>
                <strong>{availableTotal === 1 ? "1 space open for enquiry" : `${availableTotal} spaces open for enquiry`}</strong>
              </span>
            </div>
          )}
        </div>

        <form ref={formRef} method="get" action="/#available-units" className={`pub-search pub-anim-panel${enhanced ? " is-enhanced" : ""}`} aria-label="Search available spaces" onSubmit={submit} onKeyDown={(event) => event.key === "Escape" && setSheet(false)}>
          <div className="pub-search-grid">
            <div className="pub-search-segment">
              <label htmlFor="region"><PubIcon name="map-pin" /> Region (Mkoa)</label>
              <select key={`r-${query.region}`} id="region" name="region" defaultValue={query.region} onChange={(event) => update({ ...query, region: event.target.value })}>
                <option value="">All regions</option>
                {regions.map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </div>

            <div id="pub-filters" className={`pub-search-more${sheet ? " is-open" : ""}`} role={sheet ? "dialog" : undefined} aria-modal={sheet ? true : undefined} aria-labelledby="filters-title">
              <div className="pub-sheet-head">
                <div>
                  <div className="pub-sheet-grip" aria-hidden="true" />
                  <h2 id="filters-title" className="pub-h4">Filters</h2>
                </div>
                <button type="button" className="pub-icon-button" onClick={() => setSheet(false)} aria-label="Close filters"><PubIcon name="x" /></button>
              </div>

              <div className="pub-search-segment">
                <label htmlFor="property_type"><PubIcon name="layers" /> Property type</label>
                <select key={`p-${query.property_type}`} id="property_type" name="property_type" defaultValue={query.property_type} onChange={(event) => !sheet && update({ ...query, property_type: event.target.value })}>
                  <option value="">Any property type</option>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              <div className="pub-search-segment">
                <label htmlFor="unit_type"><PubIcon name="building" /> Unit type</label>
                <select key={`u-${query.unit_type}`} id="unit_type" name="unit_type" defaultValue={query.unit_type} onChange={(event) => !sheet && update({ ...query, unit_type: event.target.value })}>
                  <option value="">Any unit type</option>
                  {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              <div className="pub-sheet-actions">
                <button type="button" className="pub-btn pub-btn-secondary pub-btn-lg" disabled={!filtersActive} onClick={() => { setSheet(false); update({ ...query, region: "", property_type: "", unit_type: "" }); }}>Clear</button>
                <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg">
                  {pending ? <span className="flex items-center gap-2"><span className="pub-spinner" /> Updating</span> : `Show ${spaces(total)}`}
                </button>
              </div>
            </div>

            <div className="pub-search-actions">
              <button type="button" className="pub-btn pub-btn-secondary pub-btn-lg pub-search-more-toggle" onClick={() => setSheet(true)} aria-controls="pub-filters" aria-expanded={sheet}>
                <PubIcon name="sliders" /> Filters {extraFilters > 0 && <span className="pub-badge pub-badge-soft">{extraFilters}</span>}
              </button>
              <button type="submit" className="pub-btn pub-btn-primary pub-search-submit">
                <PubIcon name="search" /> Search spaces
              </button>
            </div>
          </div>
          {sheet && <div className="pub-sheet-backdrop" onClick={() => setSheet(false)} aria-hidden="true" />}
        </form>

        <div className="pub-hero-meta pub-anim-late">
          <p className="pub-live" role="status">
            <span className="pub-live-dot" aria-hidden="true" />
            <span>
              {pending
                ? "Updating results…"
                : filtersActive
                  ? `${total} of ${availableTotal} available units match`
                  : availableTotal === 1 ? "1 available unit right now" : `${availableTotal} available units right now`}
            </span>
          </p>
          {Object.values(typeCounts).some((count) => count > 0) && (
            <div className="pub-quick-types">
              <span>Popular:</span>
              {quickTypes.filter(([value]) => (typeCounts[value] ?? 0) > 0).map(([value, label]) => (
                <a
                  key={value}
                  href={listingQueryHref(query, { unit_type: query.unit_type === value ? "" : value })}
                  className="pub-quick-type"
                  aria-current={query.unit_type === value ? "true" : "false"}
                  onClick={(event) => { event.preventDefault(); update({ ...query, unit_type: query.unit_type === value ? "" : value }); }}
                >
                  {label} <small>{typeCounts[value]}</small>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
