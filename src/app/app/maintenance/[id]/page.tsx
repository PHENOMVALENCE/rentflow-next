import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { MaintenanceTimeline } from "@/components/workflow-ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { transitionMaintenance } from "@/server/rentflow/maintenance-actions";
import { getMaintenanceWorkflow, maintenanceNextStates } from "@/server/rentflow/workflow-read-model";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function MaintenanceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "SUPERVISOR", "TENANT"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Maintenance" title="Maintenance workflow" description="Workflow details require the production database." />
        <div className="rf-card max-w-2xl p-6"><Link href="/app/maintenance" className="rf-button rf-button-light">Back to maintenance</Link></div>
      </>
    );
  }

  const request = await getMaintenanceWorkflow(id, session);
  if (!request) notFound();

  const canTransition = session.role !== "TENANT";
  const nextStates = canTransition ? maintenanceNextStates[request.status] ?? [] : [];

  return (
    <>
      <PageHeader
        eyebrow="Maintenance"
        title={request.title}
        description={`${request.property.name}${request.unit ? ` · ${request.unit.unitNumber}` : ""} · ${request.tenant.name}`}
        action={<Link href="/app/maintenance" className="rf-button rf-button-light">Back</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)]">
        <section className="rf-panel self-start" aria-labelledby="maintenance-summary">
          <header className="rf-panel-head">
            <div className="min-w-0">
              <h2 id="maintenance-summary" className="rf-panel-title">Request summary</h2>
              <p className="rf-panel-sub">Current priority, description and valid next actions</p>
            </div>
            <Status>{request.status.replaceAll("_", " ")}</Status>
          </header>

          <div className="rf-panel-body">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rf-chip">Priority · {request.priority}</span>
              <span className="rf-chip">{request.property.name}</span>
              {request.unit && <span className="rf-chip">Unit {request.unit.unitNumber}</span>}
            </div>

            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{request.description}</p>

            {canTransition && nextStates.length > 0 && (
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <h3 className="font-semibold text-[var(--foreground)]">Advance workflow</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Only valid state transitions are offered. Add a concise operational note so the timeline remains useful.</p>
                <div className="mt-4 space-y-3">
                  {nextStates.map((status) => (
                    <form action={transitionMaintenance} key={status} className="rounded-xl border border-[var(--border)] bg-[#f8fafc] p-4">
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value={status} />
                      <label className="rf-field">
                        Transition note
                        <textarea name="note" rows={2} placeholder="What changed?" />
                      </label>
                      <button type="submit" className="rf-button rf-button-dark mt-3">Mark {status.replaceAll("_", " ").toLowerCase()}</button>
                    </form>
                  ))}
                </div>
              </div>
            )}

            {!canTransition && (
              <p className="mt-6 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--muted)]">
                You can follow the status history here. Workflow state changes are handled by the assigned operational team.
              </p>
            )}
          </div>
        </section>

        <section className="rf-panel overflow-hidden" aria-labelledby="maintenance-history">
          <header className="rf-panel-head">
            <div className="min-w-0">
              <h2 id="maintenance-history" className="rf-panel-title">Status history</h2>
              <p className="rf-panel-sub">Immutable operational timeline, newest first</p>
            </div>
          </header>
          <MaintenanceTimeline
            items={request.updates.map((update) => ({
              id: update.id,
              status: update.status.replaceAll("_", " "),
              at: date.format(update.createdAt),
              note: update.note,
            }))}
          />
        </section>
      </div>
    </>
  );
}
