import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { acknowledgeIncident, resolveIncident } from "@/server/observability/incident-actions";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function IncidentsPage() {
  await requireSession(["PLATFORM_ADMIN"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Platform operations" title="Incidents" description="Incident persistence requires the production database." action={<Link href="/app/reports" className="rf-button rf-button-light">Back</Link>} />
        <div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">The preview environment does not persist platform incidents.</div>
      </>
    );
  }

  const incidents = await db.platformIncident.findMany({ orderBy: { openedAt: "desc" }, take: 200 });

  return (
    <>
      <PageHeader
        eyebrow="Platform operations"
        title="Incidents"
        description="Operational failures and integration exceptions requiring platform attention."
        action={<Link href="/api/health/readiness" className="rf-button rf-button-light">Open readiness JSON</Link>}
      />

      <section className="rf-card overflow-hidden">
        {incidents.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No platform incidents recorded.</p>
        ) : incidents.map((incident) => (
          <article key={incident.id} className="border-b border-[var(--border)] p-5 last:border-b-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><Status>{incident.severity}</Status><Status>{incident.status}</Status></div>
                <h2 className="mt-3 font-semibold">{incident.summary}</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{incident.service} · opened {date.format(incident.openedAt)}</p>
                {incident.correlationId && <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">Correlation: {incident.correlationId}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {incident.status === "OPEN" && <form action={acknowledgeIncident}><input type="hidden" name="incidentId" value={incident.id} /><button type="submit" className="rf-button rf-button-light">Acknowledge</button></form>}
                {incident.status !== "RESOLVED" && <form action={resolveIncident}><input type="hidden" name="incidentId" value={incident.id} /><button type="submit" className="rf-button rf-button-dark">Resolve</button></form>}
              </div>
            </div>
            {incident.details && <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 text-xs leading-5 text-[var(--muted-strong)]">{JSON.stringify(incident.details, null, 2)}</pre>}
          </article>
        ))}
      </section>
    </>
  );
}
