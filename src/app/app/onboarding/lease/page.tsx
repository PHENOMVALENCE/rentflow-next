import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { acknowledgeLeaseDocument } from "@/server/rentflow/document-actions";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

function documentPriority(kind: string) {
  const normalized = kind.toUpperCase();
  if (normalized.includes("SIGNED") || normalized.includes("PAPER")) return 0;
  if (normalized.includes("LEASE") || normalized.includes("AGREEMENT")) return 1;
  return 2;
}

export default async function TenantLeaseReviewPage() {
  const session = await requireSession(["TENANT"]);
  if (!hasDatabaseConfiguration()) notFound();

  const tenant = await db.tenant.findFirst({
    where: { userId: session.userId, ...(session.organizationId ? { organizationId: session.organizationId } : {}) },
    include: {
      organization: true,
      leases: {
        include: {
          unit: { include: { property: true } },
          documents: {
            include: {
              document: true,
              acknowledgements: { where: { userId: session.userId } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!tenant) notFound();

  const lease = tenant.leases[0];
  if (!lease) {
    return <><PageHeader eyebrow="Tenant onboarding" title="Lease review" description={`Your profile is saved for ${tenant.organization.name}.`} /><div className="rf-card max-w-2xl p-6"><h2 className="font-semibold">No lease is linked yet</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Your landlord must create a tenancy and attach a lease copy before this onboarding step can be completed.</p><Link href="/app" className="rf-button rf-button-light mt-5">Go to dashboard</Link></div></>;
  }

  const links = [...lease.documents].sort((a, b) => documentPriority(a.kind) - documentPriority(b.kind));
  const link = links[0];
  if (!link) {
    return <><PageHeader eyebrow="Tenant onboarding" title="Lease review" description={`${lease.unit.property.name} · ${lease.unit.unitNumber}`} /><div className="rf-card max-w-2xl p-6"><h2 className="font-semibold">Lease copy not available yet</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">The tenancy exists, but no signed-paper or digital lease document has been attached. The landlord must attach the lease before acknowledgement can be recorded.</p><Link href={`/app/leases/${lease.id}`} className="rf-button rf-button-light mt-5">View lease status</Link></div></>;
  }

  const acknowledged = link.acknowledgements.length > 0;

  return <>
    <PageHeader eyebrow="Tenant onboarding" title="Review your lease copy" description={`${lease.unit.property.name} · ${lease.unit.unitNumber}`} />
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rf-card p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[var(--muted)]">Lease status</p><p className="mt-1 font-medium">{lease.termMonths}-month term</p></div><Status>{lease.status.replaceAll("_", " ")}</Status></div>
        <dl className="mt-6 space-y-4 border-t border-[var(--border)] pt-5 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Tenant</dt><dd>{tenant.name}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Property</dt><dd>{lease.unit.property.name}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Unit</dt><dd>{lease.unit.unitNumber}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Period</dt><dd>{date.format(lease.startDate)} – {date.format(lease.endDate)}</dd></div>
        </dl>
      </section>
      <section className="rf-card p-6">
        <p className="text-xs font-medium uppercase tracking-[.16em] text-[var(--muted)]">{link.kind.replaceAll("_", " ")}</p>
        <h2 className="mt-2 text-xl font-semibold">{link.document.name}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Open and review the lease copy before confirming receipt. This acknowledgement records that the document was made available to your account; it is not a certified electronic signature.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Link href={`/api/documents/${link.id}/download`} className="rf-button rf-button-light">Open lease copy</Link>{!acknowledged && <form action={acknowledgeLeaseDocument}><input type="hidden" name="leaseDocumentId" value={link.id} /><button type="submit" className="rf-button rf-button-dark">Confirm receipt</button></form>}</div>
        {acknowledged && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-medium">Lease copy acknowledged</p><p className="mt-1">Your onboarding document review is complete.</p><Link href="/app" className="rf-button rf-button-dark mt-4">Continue to RentFlow</Link></div>}
      </section>
    </div>
  </>;
}
