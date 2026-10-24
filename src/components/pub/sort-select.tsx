"use client";

import { useRouter } from "next/navigation";
import { listingQueryHref, type ListingQuery } from "@/lib/listing-filters";
import { useI18n } from "@/i18n/client";

/** Sort control; works as a plain GET form without JavaScript. */
export function SortSelect({ query, labels }: { query: ListingQuery; labels: Record<ListingQuery["sort"], string> }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <form method="get" action="/#available-units" className="pub-toolbar">
      {query.region && <input type="hidden" name="region" value={query.region} />}
      {query.property_type && <input type="hidden" name="property_type" value={query.property_type} />}
      {query.unit_type && <input type="hidden" name="unit_type" value={query.unit_type} />}
      <label htmlFor="sort" className="pub-sort">
        {t("Sort by")}
        <select
          id="sort"
          name="sort"
          className="pub-select"
          defaultValue={query.sort}
          onChange={(event) => router.replace(listingQueryHref({ ...query, sort: event.target.value as ListingQuery["sort"] }).replace("#available-units", ""), { scroll: false })}
        >
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
        </select>
      </label>
      <noscript><button type="submit" className="pub-btn pub-btn-secondary pub-btn-sm">{t("Apply")}</button></noscript>
    </form>
  );
}
