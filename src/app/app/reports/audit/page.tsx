import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getAuditEvidence } from "@/server/rentflow/audit-read-model";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function AuditPage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const events = await getAuditEvidence(session.organizationId);

  return (
    <>
      <PageHeader
        eyebrow="Reports & audit"
        title="Audit evidence"
        description="Chronological evidence for privileged and operational state changes."
        action={<Link href="/app/reports" className="rf-button rf-button-light">Back to reports</Link>}
      />

      <section className="rf-card overflow-hidden">
        {events.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No audit events recorded in this organization.</p>
        ) : events.map((event) => (
          <article key={event.id} className="border-b border-[var(--border)] p-5 last:border-b-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-mono text-sm font-medium">{event.action}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{event.resourceType}{event.resourceId ? ` · ${event.resourceId}` : ""}</p>
              </div>
              <div className="text-xs text-[var(--muted)] lg:text-right"><p>{event.actorName}</p><p className="mt-1">{date.format(event.createdAt)}</p></div>
            </div>
            {event.metadata && <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 text-xs leading-5 text-[var(--muted-strong)]">{JSON.stringify(event.metadata, null, 2)}</pre>}
            {event.correlationId && <p className="mt-3 font-mono text-[11px] text-[var(--muted)]">Correlation: {event.correlationId}</p>}
          </article>
        ))}
      </section>
    </>
  );
}
