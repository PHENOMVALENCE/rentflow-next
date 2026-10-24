import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { acknowledgeLeaseDocument } from "@/server/rentflow/document-actions";
import { getAuthorizedLease } from "@/server/rentflow/document-access";
import { hasPrivateObjectStorage } from "@/server/storage/private-object-store";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function LeaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "TENANT"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Lease" title="Lease workspace" description="Authoritative lease details require the production database." action={<Link href="/app/leases" className="rf-button rf-button-light">Back</Link>} />
        <div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">Preview lease records do not expose document workflows.</div>
      </>
    );
  }

  const lease = await getAuthorizedLease(id, session);
  if (!lease) notFound();
  const storageReady = hasPrivateObjectStorage();

  return (
    <>
      <PageHeader
        eyebrow="Lease"
        title={`${lease.unit.property.name} · ${lease.unit.unitNumber}`}
        description={`${lease.tenant.name} · ${lease.termMonths}-month term`}
        action={<Link href="/app/leases" className="rf-button rf-button-light">Back</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="rf-card p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[var(--muted)]">Full-term amount</p><p className="mt-1 text-3xl font-semibold">TZS {money.format(Number(lease.fullTermAmount))}</p></div><Status>{lease.status.replaceAll("_", " ")}</Status></div>
          <dl className="mt-6 space-y-4 border-t border-[var(--border)] pt-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Tenant</dt><dd>{lease.tenant.name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Start</dt><dd>{date.format(lease.startDate)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">End</dt><dd>{date.format(lease.endDate)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Currency</dt><dd>{lease.currency}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Payment</dt><dd>{lease.obligation?.status ?? "Not created"}</dd></div>
            {lease.obligation?.receipt && <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Receipt</dt><dd>{lease.obligation.receipt.receiptNo}</dd></div>}
          </dl>
          {lease.obligation && <Link href={`/app/payments/${lease.obligation.id}`} className="rf-button rf-button-light mt-6 w-full">Open payment obligation</Link>}
        </section>

        <section className="rf-card overflow-hidden">
          <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Lease documents</h2><p className="mt-1 text-xs text-[var(--muted)]">Private files are never exposed through raw storage keys.</p></div>
          {lease.documents.length === 0 ? (
            <p className="p-6 text-sm text-[var(--muted-strong)]">No documents are attached to this lease.</p>
          ) : lease.documents.map((leaseDocument) => {
            const acknowledgement = leaseDocument.acknowledgements[0] ?? null;
            return (
              <article key={leaseDocument.id} className="border-b border-[var(--border)] p-5 last:border-b-0">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{leaseDocument.document.name}</p>{leaseDocument.required && <Status>Required</Status>}</div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{leaseDocument.kind.replaceAll("_", " ")} · {leaseDocument.document.mimeType} · {Math.max(1, Math.round(leaseDocument.document.sizeBytes / 1024))} KB</p>
                    {acknowledgement && <p className="mt-2 text-xs text-emerald-700">Acknowledged {date.format(acknowledgement.acknowledgedAt)}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {storageReady ? <Link href={`/api/documents/${leaseDocument.id}/download`} className="rf-button rf-button-light">Download</Link> : <span className="rf-button rf-button-light cursor-not-allowed opacity-60">Storage pending</span>}
                    {!acknowledgement && storageReady && (
                      <form action={acknowledgeLeaseDocument}>
                        <input type="hidden" name="leaseDocumentId" value={leaseDocument.id} />
                        <button type="submit" className="rf-button rf-button-dark">Acknowledge</button>
                      </form>
                    )}
                  </div>
                </div>
                {!storageReady && !acknowledgement && <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Acknowledgement stays disabled until the private file can be retrieved securely.</p>}
              </article>
            );
          })}
        </section>
      </div>
    </>
  );
}
