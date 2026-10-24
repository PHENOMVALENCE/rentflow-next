import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PubIcon, type PubIconName } from "@/components/icons";
import { PropertyImage } from "@/components/pub/property-card";
import { PublicLayout } from "@/components/pub/sections";
import { groupedAmount, PROPERTY_TYPE_LABELS, UNIT_TYPE_LABELS } from "@/lib/listing-filters";
import { getSession } from "@/server/auth/session";
import { submitPropertyInquiry } from "@/server/rentflow/actions";
import { getPublicListing } from "@/server/rentflow/public-listing-read-model";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ enquiry?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getPublicListing((await params).id);
  return { title: listing ? `${listing.title} · Available space` : "Space not available" };
}

/** Public listing detail (Laravel `livewire.public.listing-show`). Shows public fields only. */
export default async function ListingDetail({ params, searchParams }: Props) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, getSession()]);
  const listing = await getPublicListing(id);
  if (!listing) notFound();

  const photos = listing.images ?? [];
  const tiles = photos.slice(0, 5);
  const hidden = photos.length - tiles.length;
  const unitLabel = listing.unitType ? UNIT_TYPE_LABELS[listing.unitType] : listing.unit;
  const propertyLabel = listing.propertyType ? PROPERTY_TYPE_LABELS[listing.propertyType] : listing.type;
  const rent = listing.monthly > 0 ? groupedAmount(listing.monthly) : null;
  const facts: { icon: PubIconName; label: string; value: string | number }[] = [
    { icon: "building" as const, label: "Unit type", value: unitLabel },
    { icon: "layers" as const, label: "Property type", value: propertyLabel },
    { icon: "hash" as const, label: "Unit", value: listing.unit },
    ...(listing.bedrooms > 0 ? [{ icon: "home" as const, label: "Bedrooms", value: listing.bedrooms }] : []),
    ...(listing.baths > 0 ? [{ icon: "check" as const, label: "Bathrooms", value: listing.baths }] : []),
  ];

  return (
    <PublicLayout>
      <div className="pub-detail">
        <div className="pub-container">
          <nav aria-label="Breadcrumb" className="pub-breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-hidden="true"><PubIcon name="chevron-right" size="sm" /></li>
              <li><Link href="/#available-units">Available spaces</Link></li>
              <li aria-hidden="true"><PubIcon name="chevron-right" size="sm" /></li>
              <li aria-current="page">{listing.title}</li>
            </ol>
          </nav>

          <header className="pub-detail-head">
            <div className="min-w-0">
              <p className="pub-card-type">{unitLabel}</p>
              <h1 className="pub-h1 pub-detail-title mt-1">{listing.title}</h1>
              <p className="pub-detail-meta">
                {listing.location && <span><PubIcon name="map-pin" /> {listing.location}</span>}
                <span><PubIcon name="layers" /> {propertyLabel}</span>
              </p>
            </div>
            <div className="pub-detail-actions">
              <p className="pub-status"><span className="pub-badge-dot" aria-hidden="true" />Available for enquiry</p>
            </div>
          </header>

          <div className="pub-gallery" aria-label="Photos">
            {photos.length === 0 ? (
              <div className="pub-gallery-empty"><PropertyImage alt={listing.title} kind={listing.unitType} /></div>
            ) : (
              <div className="pub-mosaic-wrap">
                <div className={`pub-mosaic pub-mosaic-${tiles.length}`}>
                  {tiles.map((photo, index) => (
                    <a key={photo.id} href={`/api/listing-images/${photo.id}`} target="_blank" rel="noreferrer" className="pub-mosaic-tile" aria-label={`Open photo ${index + 1} of ${photos.length}`}>
                      <PropertyImage imageId={photo.id} alt={photo.altText ?? `${listing.title}${photos.length > 1 ? `, photo ${index + 1} of ${photos.length}` : ""}`} eager={index === 0} />
                      {index === tiles.length - 1 && hidden > 0 && <span className="pub-mosaic-more" aria-hidden="true">+{hidden}</span>}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pub-detail-layout">
            <div className="min-w-0">
              <section className="pub-detail-section" aria-labelledby="overview-title">
                <h2 id="overview-title" className="pub-h3">Overview</h2>
                <dl className="pub-facts">
                  {facts.map((fact) => (
                    <div key={fact.label} className="pub-fact">
                      <PubIcon name={fact.icon} />
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
                {listing.description && <p className="pub-prose mt-6">{listing.description}</p>}
              </section>

              {listing.features.length > 0 && (
                <section className="pub-detail-section" aria-labelledby="features-title">
                  <h2 id="features-title" className="pub-h3">Features</h2>
                  <ul className="pub-amenities">
                    {listing.features.map((feature) => <li key={feature} className="pub-amenity"><PubIcon name="check-circle" /> {feature}</li>)}
                  </ul>
                </section>
              )}

              <section className="pub-detail-section" aria-labelledby="terms-title">
                <h2 id="terms-title" className="pub-h3">Lease terms</h2>
                <ul className="pub-terms">
                  <li className="pub-term">
                    <PubIcon name="calendar" />
                    <div><strong>3- or 6-month terms</strong><p>A 3- or 6-month lease is paid in full for the term. The property team confirms the exact total before you pay.</p></div>
                  </li>
                  <li className="pub-term">
                    <PubIcon name="wallet" />
                    <div><strong>{rent ? `Indicative rent TZS ${rent} a month` : "Rent on enquiry"}</strong><p>Shown as a guide. The amount you pay is the agreed full-term total, recorded in RentFlow.</p></div>
                  </li>
                  <li className="pub-term">
                    <PubIcon name="shield" />
                    <div><strong>Enquiring is free and doesn&apos;t reserve the unit</strong><p>The space stays available to others until a lease is agreed and paid.</p></div>
                  </li>
                </ul>
              </section>

              <section id="enquire" tabIndex={-1} className="pub-detail-section pub-enquiry pub-focus-target" aria-labelledby="enquire-title">
                <h2 id="enquire-title" className="pub-h3">Contact the property team</h2>
                <p className="pub-muted mt-2">Ask a question or suggest a time to view. The team replies to you directly.</p>
                <div className="pub-enquiry-card mt-5">
                  {query.enquiry === "sent" ? (
                    <div className="pub-alert pub-alert-success" role="status">
                      <PubIcon name="check-circle" />
                      <div>
                        <p className="font-semibold">We received your enquiry</p>
                        <p>The property team can now contact you. The unit is not reserved until a lease is agreed.</p>
                      </div>
                    </div>
                  ) : (
                    <form action={submitPropertyInquiry} className="pub-form-grid">
                      {query.enquiry === "unavailable" && (
                        <div className="pub-alert pub-alert-error" role="alert"><PubIcon name="alert" /><p>Enquiries are paused until the production database is connected. Please try again later.</p></div>
                      )}
                      <input type="hidden" name="listingId" value={listing.id} />
                      <div className="pub-form-grid pub-form-grid-2">
                        <div className="pub-field">
                          <label htmlFor="full_name" className="pub-label">Your name</label>
                          <input id="full_name" name="name" type="text" className="pub-input" autoComplete="name" maxLength={120} required />
                        </div>
                        <div className="pub-field">
                          <label htmlFor="phone" className="pub-label">Phone</label>
                          <input id="phone" name="phone" type="tel" inputMode="tel" className="pub-input" autoComplete="tel" maxLength={32} placeholder="0712 000 000" required aria-describedby="phone-hint" />
                          <p id="phone-hint" className="pub-hint">Tanzania mobile number.</p>
                        </div>
                      </div>
                      <div className="pub-field">
                        <label htmlFor="email" className="pub-label">Email <span className="pub-optional">(optional)</span></label>
                        <input id="email" name="email" type="email" className="pub-input" autoComplete="email" maxLength={255} />
                      </div>
                      <div className="pub-field">
                        <label htmlFor="details" className="pub-label">Message</label>
                        <textarea id="details" name="message" className="pub-textarea" rows={4} maxLength={2000} required placeholder="Ask a question or suggest a time to view the space." />
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg"><PubIcon name="send" /> Send enquiry</button>
                        <p className="pub-meta">An enquiry does not reserve the unit or start a lease.</p>
                      </div>
                    </form>
                  )}
                </div>
              </section>
            </div>

            <aside aria-label="Price and availability">
              <div className="pub-aside-card pub-aside-sticky">
                <div className="pub-aside-price">
                  {rent ? <><strong>TZS {rent}</strong><span className="pub-muted">/ month</span></> : <strong>Rent on enquiry</strong>}
                </div>
                <p className="pub-meta mt-1">{rent ? "Indicative monthly rent" : "Ask the property team for terms"}</p>
                <p className="pub-status mt-4"><span className="pub-badge-dot" aria-hidden="true" />Available now</p>
                <ul className="pub-aside-list">
                  <li><PubIcon name="calendar" size="sm" /> 3- or 6-month lease, paid in full for the term</li>
                  <li><PubIcon name="message" size="sm" /> Replies come straight from the property team</li>
                  <li><PubIcon name="shield" size="sm" /> Enquiring doesn&apos;t reserve the unit</li>
                </ul>
                <a href="#enquire" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block"><PubIcon name="message" /> Send enquiry</a>
                <Link href="/#available-units" className="pub-btn pub-btn-ghost pub-btn-block mt-2"><PubIcon name="arrow-left" /> Back to all spaces</Link>
                {!session && <p className="pub-meta mt-4 text-center">Already rent with RentFlow? <Link href="/login" className="pub-link">Sign in</Link></p>}
              </div>
            </aside>
          </div>
        </div>

        <div className="pub-mobile-bar">
          <div>
            {rent ? <><strong>TZS {rent}</strong><span className="pub-meta">per month, indicative</span></> : <strong>Rent on enquiry</strong>}
          </div>
          <a href="#enquire" className="pub-btn pub-btn-primary">Send enquiry</a>
        </div>
      </div>
    </PublicLayout>
  );
}
