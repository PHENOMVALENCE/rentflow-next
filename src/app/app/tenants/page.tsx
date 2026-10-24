import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Empty, PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getTenantsSection } from "@/server/rentflow/operations-read-model";

export default async function TenantsPage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN", "SUPERVISOR"]);
  const tenants = await getTenantsSection(session);
  const canCreate = session.role === "PLATFORM_ADMIN" || session.role === "LANDLORD" || session.role === "PROPERTY_ADMIN";

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Tenants"
        description={session.role === "SUPERVISOR" ? "Tenants with active rental relationships in your assigned properties." : "Manage tenant records, rental relationships and document requests."}
        action={canCreate ? <Link href="/app/tenants/new" className="rf-button rf-button-dark"><AppIcon name="plus" className="h-4 w-4" /> New tenant</Link> : undefined}
      />

      {tenants.length === 0 ? (
        <Empty icon="users" title="No tenants found">No tenant records are available in your current access scope.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tenants.map((tenant) => {
            const canOpen = session.role !== "SUPERVISOR";
            const content = (
              <article className={`rf-card h-full p-5 ${canOpen ? "group transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-sm" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="rf-icon-tile" aria-hidden="true"><AppIcon name="user" /></span>
                  <Status>{tenant.status}</Status>
                </div>
                <h2 className="mt-4 font-semibold text-[var(--foreground)]">{tenant.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{tenant.subtitle}</p>
                {tenant.meta && <p className="mt-3 text-xs text-[var(--muted)]">{tenant.meta}</p>}
                {canOpen && (
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
                    Open tenant record <AppIcon name="chevron-right" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                )}
              </article>
            );
            return canOpen ? <Link key={tenant.id} href={`/app/tenants/${tenant.id}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-xl">{content}</Link> : <div key={tenant.id}>{content}</div>;
          })}
        </div>
      )}
    </>
  );
}
