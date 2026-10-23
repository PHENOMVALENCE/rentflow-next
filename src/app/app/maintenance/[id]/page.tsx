import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { transitionMaintenance } from "@/server/rentflow/maintenance-actions";
import { getMaintenanceWorkflow, maintenanceNextStates } from "@/server/rentflow/workflow-read-model";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function MaintenanceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "SUPERVISOR"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Maintenance" title="Maintenance workflow" description="Workflow transitions require the production database." />
        <div className="rf-card max-w-2xl p-6"><Link href="/app/maintenance" className="rf-button rf-button-light">Back to maintenance</Link></div>
      </>
    );
  }

  const request = await getMaintenanceWorkflow(id, session.organizationId);
  if (!request) notFound();

  const nextStates = maintenanceNextStates[request.status] ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Maintenance"
        title={request.title}
        description={`${request.property.name}${request.unit ? ` · ${request.unit.unitNumber}` : ""} · ${request.tenant.name}`}
        action={<Link href="/app/maintenance" className="rf-button rf-button-light">Back</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="rf-card p-6">
          <div className="flex items-center justify-between gap-3"><Status>{request.status.replaceAll("_", " ")}</Status><span className="text-xs text-[var(--muted)]">{request.priority}</span></div>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{request.description}</p>

          {nextStates.length > 0 && (
            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <h2 className="font-semibold">Advance workflow</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Only valid state transitions are offered.</p>
              <div className="mt-4 space-y-3">
                {nextStates.map((status) => (
                  <form action={transitionMaintenance} key={status} className="rounded-xl border border-[var(--border)] p-4">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="status" value={status} />
                    <label className="block text-xs font-medium text-[var(--muted-strong)]">Transition note<textarea name="note" rows={2} className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" /></label>
                    <button type="submit" className="rf-button rf-button-dark mt-3">Mark {status.replaceAll("_", " ").toLowerCase()}</button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rf-card overflow-hidden">
          <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Status history</h2><p className="mt-1 text-xs text-[var(--muted)]">Immutable operational timeline</p></div>
          {request.updates.map((update) => (
            <div key={update.id} className="border-b border-[var(--border)] p-5 last:border-b-0">
              <div className="flex items-center justify-between gap-4"><Status>{update.status.replaceAll("_", " ")}</Status><span className="text-xs text-[var(--muted)]">{date.format(update.createdAt)}</span></div>
              {update.note && <p className="mt-3 text-sm text-[var(--muted-strong)]">{update.note}</p>}
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
