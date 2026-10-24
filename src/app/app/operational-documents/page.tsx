import Link from "next/link";
import { NeedsOrganization } from "@/components/needs-organization";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function OperationalDocumentsPage() {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!session.organizationId) return <NeedsOrganization session={session} title="Operational documents" />;
  const documents = hasDatabaseConfiguration() ? await db.operationalDocument.findMany({ where: { organizationId: session.organizationId }, orderBy: [{ category: "asc" }, { createdAt: "desc" }] }) : [];

  return (
    <>
      <PageHeader eyebrow="Documents" title="Operational documents" description="Private organization files used for portfolio operations and reporting." />
      <div className="rf-card overflow-hidden">
        {documents.length === 0 ? <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No operational documents are stored.</p> : documents.map((document) => <Link key={document.id} href={`/api/operational-documents/${document.id}/download`} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 hover:bg-slate-50 md:grid-cols-[1fr_.5fr_auto] md:items-center"><div><p className="font-medium">{document.name}</p><p className="mt-1 text-xs text-[var(--muted)]">Private organization document</p></div><span className="text-sm capitalize">{document.category.replaceAll("_", " ").toLowerCase()}</span><span className="text-xs text-[var(--muted)] md:text-right">{date.format(document.updatedAt)}</span></Link>)}
      </div>
    </>
  );
}
