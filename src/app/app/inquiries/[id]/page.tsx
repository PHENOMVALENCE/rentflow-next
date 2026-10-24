import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { qualifyInquiryAsProspect, updateInquiryStatus } from "@/server/rentflow/inquiry-actions";
import { getInquiryDetail } from "@/server/rentflow/inquiry-read-model";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function InquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Leasing pipeline" title="Inquiry detail" description="Qualification requires the production database." action={<Link href="/app/inquiries" className="rf-button rf-button-light">Back</Link>} />
        <div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">Preview inquiries are read-only.</div>
      </>
    );
  }

  const inquiry = await getInquiryDetail(id, session.organizationId);
  if (!inquiry) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Leasing pipeline"
        title={inquiry.name}
        description={inquiry.listing ? `${inquiry.listing.title} · ${inquiry.listing.unit.property.name} · ${inquiry.listing.unit.unitNumber}` : "Direct inquiry"}
        action={<Link href="/app/inquiries" className="rf-button rf-button-light">Back</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rf-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><Status>{inquiry.status}</Status><span className="text-xs text-[var(--muted)]">Received {date.format(inquiry.createdAt)}</span></div>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-[var(--muted)]">Phone</dt><dd className="mt-1 font-medium">{inquiry.phone}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Email</dt><dd className="mt-1 font-medium">{inquiry.email ?? "—"}</dd></div>
          </dl>
          <div className="mt-6 border-t border-[var(--border)] pt-5"><p className="text-xs text-[var(--muted)]">Message</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{inquiry.message || "No message provided."}</p></div>

          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <h2 className="font-semibold">Update pipeline state</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {["NEW", "CONTACTED", "QUALIFIED", "CLOSED"].map((status) => (
                <form action={updateInquiryStatus} key={status}>
                  <input type="hidden" name="inquiryId" value={inquiry.id} />
                  <input type="hidden" name="status" value={status} />
                  <button type="submit" className={status === inquiry.status ? "rf-button rf-button-dark" : "rf-button rf-button-light"}>{status.replaceAll("_", " ").toLowerCase()}</button>
                </form>
              ))}
            </div>
          </div>
        </section>

        <aside className="rf-card h-fit p-5">
          <h2 className="font-semibold">Qualification</h2>
          {inquiry.prospect ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-medium">Prospect created</p>
              <p className="mt-1 text-xs">Status: {inquiry.prospect.status} · source: {inquiry.prospect.source ?? "inquiry"}</p>
              <p className="mt-1 text-xs">Created {date.format(inquiry.prospect.createdAt)}</p>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Qualifying creates a CRM-style prospect record from this public inquiry and marks the inquiry as qualified.</p>
              <form action={qualifyInquiryAsProspect} className="mt-5"><input type="hidden" name="inquiryId" value={inquiry.id} /><button type="submit" className="rf-button rf-button-dark w-full">Qualify as prospect</button></form>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
