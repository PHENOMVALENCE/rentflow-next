import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { canCreateSection } from "@/server/auth/authorization";
import { requireSession } from "@/server/auth/session";
import { pauseListing, publishListing } from "@/server/rentflow/listing-actions";
import { getListingsManagement } from "@/server/rentflow/workflow-read-model";

export default async function ListingsPage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const rows = await getListingsManagement(session.organizationId);
  const action = canCreateSection(session.role, "listings") ? <Link href="/app/listings/new" className="rf-button rf-button-dark">New listing</Link> : undefined;

  return (
    <>
      <PageHeader eyebrow="Operations" title="Listings" description="Control public presentation and listing media without overriding authoritative occupancy." action={action} />
      {rows.length === 0 ? <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No listings found.</div> : (
        <div className="rf-card overflow-hidden">
          {rows.map((row) => (
            <div key={row.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1.4fr_.6fr_.7fr_auto] lg:items-center">
              <div><Link href={`/app/listings/${row.id}`} className="font-medium hover:underline">{row.title}</Link><p className="mt-1 text-xs text-[var(--muted)]">{row.property} · {row.unit}</p><Link href={`/app/listings/${row.id}`} className="mt-2 inline-block text-xs font-medium">Manage media →</Link></div>
              <Status>{row.status}</Status>
              <p className="text-xs text-[var(--muted)]">Published: {row.publishedAt}</p>
              <div className="flex gap-2">{row.status === "Published" ? <form action={pauseListing}><input type="hidden" name="listingId" value={row.id} /><button className="rf-button rf-button-light" type="submit">Pause</button></form> : <form action={publishListing}><input type="hidden" name="listingId" value={row.id} /><button className="rf-button rf-button-dark" type="submit" disabled={!row.eligible}>Publish</button></form>}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
