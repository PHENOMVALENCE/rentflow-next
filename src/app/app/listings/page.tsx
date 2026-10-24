import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Empty, PageHeader, Panel, Status } from "@/components/ui";
import { canCreateSection } from "@/server/auth/authorization";
import { requireSession } from "@/server/auth/session";
import { pauseListing, publishListing } from "@/server/rentflow/listing-actions";
import { getListingsManagement } from "@/server/rentflow/workflow-read-model";

export default async function ListingsPage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const rows = await getListingsManagement(session.organizationId);
  const action = canCreateSection(session.role, "listings")
    ? <Link href="/app/listings/new" className="rf-button rf-button-dark"><AppIcon name="plus" className="h-4 w-4" /> New listing</Link>
    : undefined;

  return (
    <>
      <PageHeader eyebrow="Operations" title="Listings" description="Control public presentation and listing media without overriding authoritative occupancy." action={action} />

      {rows.length === 0 ? (
        <Empty icon="home" title="No listings found">Create a listing from an eligible unit to begin publishing property availability.</Empty>
      ) : (
        <Panel title="Listing management" subtitle={`${rows.length} ${rows.length === 1 ? "listing" : "listings"} in your workspace`} flush>
          <div>
            {rows.map((row) => (
              <article key={row.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[minmax(0,1.45fr)_.55fr_.65fr_auto] lg:items-center">
                <div className="min-w-0">
                  <Link href={`/app/listings/${row.id}`} className="group inline-flex min-w-0 items-center gap-1 font-semibold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded">
                    <span className="truncate">{row.title}</span><AppIcon name="chevron-right" className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
                  </Link>
                  <p className="mt-1 text-xs text-[var(--muted)]">{row.property} · {row.unit}</p>
                  <Link href={`/app/listings/${row.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]"><AppIcon name="image" className="h-3.5 w-3.5" /> Manage media</Link>
                </div>
                <div><Status>{row.status}</Status></div>
                <div className="text-xs text-[var(--muted)]">
                  <p>Published</p>
                  <p className="mt-1 font-medium text-[var(--muted-strong)]">{row.publishedAt}</p>
                </div>
                <div className="flex gap-2 lg:justify-end">
                  {row.status === "Published" ? (
                    <form action={pauseListing}>
                      <input type="hidden" name="listingId" value={row.id} />
                      <button className="rf-button rf-button-light" type="submit">Pause</button>
                    </form>
                  ) : (
                    <form action={publishListing}>
                      <input type="hidden" name="listingId" value={row.id} />
                      <button className="rf-button rf-button-dark" type="submit" disabled={!row.eligible}>Publish</button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
