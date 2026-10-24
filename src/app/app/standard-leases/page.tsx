import Link from "next/link";
import { NeedsOrganization } from "@/components/needs-organization";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { storeStandardLeaseTemplate } from "@/server/rentflow/lease-template-actions";
import { hasPrivateObjectStorage } from "@/server/storage/private-object-store";

export default async function StandardLeasesPage() {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!session.organizationId) return <NeedsOrganization session={session} title="Standard leases" />;
  const templates = hasDatabaseConfiguration() ? await db.organizationLeaseTemplate.findMany({ where: { organizationId: session.organizationId, active: true }, orderBy: { createdAt: "desc" } }) : [];
  const templateFor = (months: number) => templates.find((template) => template.name.startsWith(`${months}-month standard lease`));

  return (
    <>
      <PageHeader eyebrow="Agreements" title="Standard leases" description="Store the standard 3- and 6-month source documents used when preparing new tenancies. RentFlow stores the supplied legal wording; it does not author it." />
      {!hasPrivateObjectStorage() && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Private object storage is not configured in this runtime. Existing metadata remains visible, but uploads are unavailable until a private storage provider is connected.</div>}
      <div className="grid gap-5 lg:grid-cols-2">
        {[3, 6].map((months) => {
          const current = templateFor(months);
          return <section key={months} className="rf-card p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[var(--muted)]">Standard term</p><h2 className="mt-1 text-xl font-semibold">{months}-month lease</h2></div><Status>{current ? "Stored" : "Missing"}</Status></div>{current && <div className="mt-5 rounded-xl border border-[var(--border)] p-4"><p className="font-medium">{current.name.replace(`${months}-month standard lease · `, "")}</p><p className="mt-1 text-xs text-[var(--muted)]">Active template</p><Link href={`/api/lease-templates/${current.id}/download`} className="mt-3 inline-block text-sm font-medium">Open current file →</Link></div>}<form action={storeStandardLeaseTemplate} className="mt-5 border-t border-[var(--border)] pt-5"><input type="hidden" name="termMonths" value={months} /><label className="block text-sm font-medium">{current ? "Replace template" : "Upload template"}<input type="file" name="file" accept="application/pdf,image/png,image/jpeg" required disabled={!hasPrivateObjectStorage()} className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm" /></label><button type="submit" disabled={!hasPrivateObjectStorage()} className="rf-button rf-button-dark mt-4">Save {months}-month template</button></form></section>;
        })}
      </div>
    </>
  );
}
