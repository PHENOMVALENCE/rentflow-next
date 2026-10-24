import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { acknowledgePlatformIncidentAction, resolvePlatformIncidentAction } from "@/server/rentflow/platform-incident-actions";
import { getPlatformIncidents } from "@/server/rentflow/platform-read-model";

export default async function PlatformIncidentsPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  await requireSession(["PLATFORM_ADMIN"]);
  const query = await searchParams;
  const incidents = await getPlatformIncidents();
  const persistenceReady = hasDatabaseConfiguration();

  return (
    <>
      <PageHeader eyebrow="Platform operations" title="Incidents" description="Acknowledge and resolve platform reliability incidents with an auditable state transition." />

      {query.updated === "1" && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Incident state updated.</div>}
      {query.error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">The incident transition was not accepted. Check the current state and required resolution reason.</div>}

      {!persistenceReady && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Preview incidents are read-only until PostgreSQL is attached.</div>}

      <div className="space-y-4">
        {incidents.length === 0 ? <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No incidents recorded.</div> : incidents.map((incident) => (
          <article key={incident.id} className="rf-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{incident.href ? <Link href={incident.href} className="rf-link">{incident.primary}</Link> : incident.primary}</h2><Status>{incident.status}</Status></div><p className="mt-2 text-sm text-[var(--muted-strong)]">{incident.secondary}</p><p className="mt-1 text-xs text-[var(--muted)]">Severity: {incident.meta}</p></div>

              {persistenceReady && incident.status === "OPEN" && (
                <form action={acknowledgePlatformIncidentAction}>
                  <input type="hidden" name="incidentId" value={incident.id} />
                  <button type="submit" className="rf-button rf-button-dark">Acknowledge</button>
                </form>
              )}
            </div>

            {persistenceReady && incident.status === "ACKNOWLEDGED" && (
              <form action={resolvePlatformIncidentAction} className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 md:grid-cols-[1fr_auto] md:items-end">
                <input type="hidden" name="incidentId" value={incident.id} />
                <label className="block text-sm font-medium">Resolution reason<input required name="reason" minLength={8} maxLength={500} placeholder="Describe what was resolved and why the incident can close" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>
                <button type="submit" className="rf-button rf-button-dark">Resolve incident</button>
              </form>
            )}
          </article>
        ))}
      </div>

      <p className="mt-5 text-xs leading-5 text-[var(--muted)]">Current Next.js persistence supports OPEN → ACKNOWLEDGED → RESOLVED. Laravel also models INVESTIGATING, MITIGATED and CLOSED; those states require the reviewed Prisma migration before they can be enabled safely.</p>
    </>
  );
}
