import Link from "next/link";
import { PubIcon } from "@/components/icons";
import type { Listing } from "@/lib/demo-data";
import { hasActiveFilters, listingQueryHref, PROPERTY_TYPE_LABELS, SORT_LABELS, UNIT_TYPE_LABELS, type ListingQuery } from "@/lib/listing-filters";
import { getTranslator } from "@/i18n/server";
import { plural } from "@/i18n/translate";
import { ListingGrid } from "./listing-grid";
import { PubState } from "./sections";
import { SortSelect } from "./sort-select";

/** "Spaces available now" grid with active-filter chips and empty states (Laravel `partials.results`). */
export async function ListingResults({ listings, query, signedIn }: { listings: Listing[]; query: ListingQuery; signedIn: boolean }) {
  const { t } = await getTranslator();
  const total = listings.length;
  const filtersActive = hasActiveFilters(query);
  const chips = [
    { field: "region" as const, label: query.region, name: t("region") },
    { field: "property_type" as const, label: PROPERTY_TYPE_LABELS[query.property_type] && t(PROPERTY_TYPE_LABELS[query.property_type]), name: t("property type") },
    { field: "unit_type" as const, label: UNIT_TYPE_LABELS[query.unit_type] && t(UNIT_TYPE_LABELS[query.unit_type]), name: t("unit type") },
  ].filter((chip) => query[chip.field] !== "" && chip.label);

  return (
    <section id="available-units" tabIndex={-1} className="pub-section pub-focus-target" aria-labelledby="available-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <div>
            <h2 id="available-title" tabIndex={-1} className="pub-h2 pub-focus-target">{t("Spaces available now")}</h2>
            <p className="pub-lead" role="status">
              {total === 0
                ? t("No units match right now.")
                : filtersActive
                  ? plural(t, total, "1 unit currently accepting enquiries for these filters.", ":count units currently accepting enquiries for these filters.")
                  : plural(t, total, "1 unit currently accepting enquiries across Tanzania.", ":count units currently accepting enquiries across Tanzania.")}
            </p>
          </div>
          {total > 1 && <SortSelect query={query} labels={SORT_LABELS} />}
        </div>

        {chips.length > 0 && (
          <ul className="pub-active-filters" aria-label={t("Active filters")}>
            {chips.map((chip) => (
              <li key={chip.field}>
                <Link href={listingQueryHref(query, { [chip.field]: "" })} scroll={false} className="pub-chip" aria-label={t("Remove :name filter: :value", { name: chip.name, value: chip.label ?? "" })}>
                  {chip.label} <PubIcon name="x" />
                </Link>
              </li>
            ))}
            <li><Link href={listingQueryHref(query, { region: "", property_type: "", unit_type: "" })} scroll={false} className="pub-text-button">{t("Clear filters")}</Link></li>
          </ul>
        )}

        <div className="pub-results">
          {total === 0 ? (
            filtersActive ? (
              <PubState
                title={t("No available units match these filters")}
                icon="search"
                actions={<Link href={listingQueryHref(query, { region: "", property_type: "", unit_type: "" })} scroll={false} className="pub-btn pub-btn-primary">{t("Clear filters")}</Link>}
              >
                <p>{t("Occupied units are never listed. You could try:")}</p>
                <ul>
                  <li>{t("choosing another region")}</li>
                  <li>{t("selecting a different property or unit type")}</li>
                  <li>{t("clearing your filters to see every available space")}</li>
                </ul>
              </PubState>
            ) : (
              <PubState title={t("No units are publicly available right now")} icon="building" actions={signedIn ? undefined : <Link href="/login" className="pub-btn pub-btn-secondary">{t("Sign in")}</Link>}>
                <p>{t("New spaces appear here as soon as property teams list them. If you already rent with RentFlow, sign in to manage your lease.")}</p>
              </PubState>
            )
          ) : (
            <ListingGrid listings={listings} />
          )}
        </div>
      </div>
    </section>
  );
}
