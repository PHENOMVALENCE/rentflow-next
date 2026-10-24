import Link from "next/link";
import { notFound } from "next/navigation";
import { AuditList, Facts, PageHeader, Panel, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { acknowledgePlatformIncidentAction, resolvePlatformIncidentAction } from "@/server/rentflow/platform-incident-actions";
import { getIncidentDetail } from "@/server/rentflow/platform-detail-read-model";

export const metadata = { title: "Incident" };

export default async function PlatformIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(["PLATFORM_ADMIN"]);
  const incident = await getIncidentDetail((await params).id);
  if (!incident) notFound();
  const writable = hasDatabaseConfiguration();

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/app/platform/incidents" className="rf-link">← Incidents</Link></p>
      <PageHeader eyebrow={`Platform · Incident · ${incident.service}`} title={incident.summary} action={<Status>{incident.status}</Status>} />
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Panel title="Timeline">
            <Facts items={[["Opened", incident.opened], ["Acknowledged", incident.acknowledged], ["Resolved", incident.resolved], ["Severity", incident.severity], ["Correlation ID", incident.correlationId && <span className="rf-mono">{incident.correlationId}</span>]]} />
          </Panel>
          <Panel title="Related audit events" flush>
            <AuditList rows={incident.audit} />
          </Panel>
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <Panel title="Next action">
            {!writable ? (
              <p className="text-sm text-[#51607a]">Incident transitions need the database.</p>
            ) : incident.status === "OPEN" ? (
              <form action={acknowledgePlatformIncidentAction}>
                <input type="hidden" name="incidentId" value={incident.id} />
                <button type="submit" className="rf-btn-primary w-full">Acknowledge</button>
              </form>
            ) : incident.status === "ACKNOWLEDGED" ? (
              <form action={resolvePlatformIncidentAction} className="rf-field">
                <input type="hidden" name="incidentId" value={incident.id} />
                <label htmlFor="reason">Resolution reason</label>
                <textarea id="reason" required name="reason" minLength={8} maxLength={500} rows={3} placeholder="What was resolved and why the incident can close" />
                <button type="submit" className="rf-btn-primary mt-2">Resolve incident</button>
              </form>
            ) : (
              <p className="text-sm text-[#51607a]">Resolved. No further action.</p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
