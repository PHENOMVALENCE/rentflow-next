import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { searchPlatform } from "@/server/rentflow/platform-search";

export default async function PlatformSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession(["PLATFORM_ADMIN"]);
  const query = (await searchParams).q ?? "";
  const search = await searchPlatform(query);

  return (
    <>
      <PageHeader eyebrow="Platform operations" title="Platform search" description="Search organizations, users, properties, payments, incidents and audit evidence from one privileged surface." />

      <form className="rf-card mb-6 flex flex-col gap-3 p-4 sm:flex-row" action="/app/platform/search" method="get">
        <input name="q" defaultValue={search.query} minLength={2} maxLength={100} placeholder="Search name, property, reference, incident or audit action…" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
        <button className="rf-button rf-button-dark" type="submit">Search</button>
      </form>

      {search.query.length < 2 ? (
        <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">Enter at least two characters to search the platform.</div>
      ) : search.results.length === 0 ? (
        <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No operational records matched “{search.query}”.</div>
      ) : (
        <div className="rf-card overflow-hidden">
          {search.results.map((row) => (
            <div key={row.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-[1.5fr_.8fr_auto] md:items-center">
              <div><p className="font-medium">{row.primary}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.secondary}</p></div>
              <p className="text-xs text-[var(--muted)]">{row.meta}</p>
              <div className="md:text-right"><Status>{row.status}</Status></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
