import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { importGeographyCsv } from "@/server/rentflow/geography-actions";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function GeographySettingsPage() {
  await requireSession(["PLATFORM_ADMIN"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Platform settings" title="Geography import" description="Geographic reference imports require the production database." action={<Link href="/app/settings" className="rf-button rf-button-light">Back</Link>} />
        <div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">Connect PostgreSQL before importing regions, districts, wards, streets, or villages.</div>
      </>
    );
  }

  const batches = await db.geoImportBatch.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <>
      <PageHeader
        eyebrow="Platform settings"
        title="Geography import"
        description="Load Tanzania reference geography with row-level success and failure evidence."
        action={<Link href="/app/settings" className="rf-button rf-button-light">Back</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="rf-card p-6">
          <h2 className="font-semibold">Import CSV</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Imports are idempotent for region, district and ward codes. Existing names are updated; streets/villages are created only when the same name and kind do not already exist in the ward.</p>
          <form action={importGeographyCsv} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">CSV file<input name="file" type="file" accept=".csv,text/csv" required className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm" /></label>
            <button type="submit" className="rf-button rf-button-dark">Import geography</button>
          </form>
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <p className="text-xs font-medium text-[var(--muted-strong)]">Required headers</p>
            <code className="mt-2 block overflow-x-auto rounded-xl bg-slate-50 p-3 text-[11px] leading-5">region_code,region_name,district_code,district_name,ward_code,ward_name,street_village_name,kind</code>
            <p className="mt-2 text-xs text-[var(--muted)]">`kind` is optional and defaults to STREET; when supplied it must be STREET or VILLAGE. Maximum 2 MB / 5,000 rows per import.</p>
          </div>
        </section>

        <section className="rf-card overflow-hidden">
          <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Recent imports</h2><p className="mt-1 text-xs text-[var(--muted)]">Each row has a corresponding import record for diagnostics.</p></div>
          {batches.length === 0 ? <p className="p-6 text-sm text-[var(--muted-strong)]">No geography imports yet.</p> : batches.map((batch) => (
            <div key={batch.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><p className="font-medium">{batch.sourceName}</p><p className="mt-1 text-xs text-[var(--muted)]">{date.format(batch.createdAt)} · {batch.totalRows} rows</p></div>
              <div className="flex flex-wrap gap-2"><Status>{`${batch.successRows} success`}</Status>{batch.failedRows > 0 && <Status>{`${batch.failedRows} failed`}</Status>}</div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
