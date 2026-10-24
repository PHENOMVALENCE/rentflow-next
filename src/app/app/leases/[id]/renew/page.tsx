import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { createLeaseRenewal } from "@/server/rentflow/renewal-actions";

const money = new Intl.NumberFormat("en-TZ", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export default async function RenewLeasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Lease renewal" title="Create successor lease" description="Renewal requires the production database." action={<Link href={`/app/leases/${id}`} className="rf-button rf-button-light">Back</Link>} />
        <div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">Preview mode cannot create authoritative renewal obligations.</div>
      </>
    );
  }

  const predecessor = await db.lease.findFirst({
    where: {
      id,
      ...(session.organizationId ? { unit: { property: { organizationId: session.organizationId } } } : {}),
    },
    include: {
      tenant: true,
      unit: { include: { property: true } },
      successor: { where: { status: { notIn: ["TERMINATED", "EXPIRED"] } }, take: 1 },
    },
  });
  if (!predecessor) notFound();

  const renewable = predecessor.status === "RENEWAL_WINDOW" || predecessor.status === "GRACE";
  const monthlyRent = Number(predecessor.unit.monthlyRent ?? 0);
  const existingSuccessor = predecessor.successor[0] ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Lease renewal"
        title={`${predecessor.unit.property.name} · ${predecessor.unit.unitNumber}`}
        description={`${predecessor.tenant.name} · predecessor ends ${date.format(predecessor.endDate)}`}
        action={<Link href={`/app/leases/${predecessor.id}`} className="rf-button rf-button-light">Back to lease</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="rf-card p-6">
          <div className="flex items-center justify-between gap-3"><Status>{predecessor.status.replaceAll("_", " ")}</Status><span className="text-xs text-[var(--muted)]">Lease {predecessor.id.slice(0, 8)}</span></div>
          <dl className="mt-6 space-y-4 border-t border-[var(--border)] pt-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Monthly rent</dt><dd>TZS {money.format(monthlyRent)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Current end</dt><dd>{date.format(predecessor.endDate)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Next start boundary</dt><dd>{date.format(predecessor.endDate)}</dd></div>
          </dl>
        </section>

        <section className="rf-card p-6">
          {existingSuccessor ? (
            <>
              <h2 className="font-semibold">Renewal already exists</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">This predecessor already has a non-terminal successor lease. Duplicate renewals are not allowed.</p>
              <Link href={`/app/leases/${existingSuccessor.id}`} className="rf-button rf-button-dark mt-5">Open successor lease</Link>
            </>
          ) : !renewable ? (
            <>
              <h2 className="font-semibold">Not currently renewable</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Renewal creation is allowed only once the lease enters its 14-day renewal window or the 7-day grace period.</p>
            </>
          ) : monthlyRent <= 0 || !Number.isSafeInteger(monthlyRent) ? (
            <>
              <h2 className="font-semibold">Monthly rent needs correction</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Renewal requires a positive whole-TZS monthly rent before an exact obligation can be created.</p>
            </>
          ) : (
            <>
              <h2 className="font-semibold">Create successor</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">The predecessor remains unchanged until verified payment settles the successor. The successor begins as awaiting payment.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[3, 6].map((term) => (
                  <form action={createLeaseRenewal} key={term} className="rounded-xl border border-[var(--border)] p-5">
                    <input type="hidden" name="predecessorLeaseId" value={predecessor.id} />
                    <input type="hidden" name="termMonths" value={term} />
                    <p className="text-sm font-medium">{term} months</p>
                    <p className="mt-2 text-2xl font-semibold">TZS {money.format(monthlyRent * term)}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">One exact full-term obligation. No partial activation.</p>
                    <button type="submit" className="rf-button rf-button-dark mt-5 w-full">Create {term}-month renewal</button>
                  </form>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
