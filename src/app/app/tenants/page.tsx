import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
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
        action={canCreate ? <Link href="/app/tenants/new" className="rf-button rf-button-dark">New tenant</Link> : undefined}
      />

      {tenants.length === 0 ? (
        <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">No tenants found in your access scope.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tenants.map((tenant) => {
            const canOpen = session.role !== "SUPERVISOR";
            const content = (
              <div className="rf-card h-full p-5">
                <div className="flex items-center justify-between gap-3"><Status>{tenant.status}</Status>{tenant.meta && <span className="text-xs text-[var(--muted)]">{tenant.meta}</span>}</div>
                <h2 className="mt-4 font-semibold">{tenant.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{tenant.subtitle}</p>
                {canOpen && <p className="mt-4 text-xs font-medium">Open tenant record →</p>}
              </div>
            );
            return canOpen ? <Link key={tenant.id} href={`/app/tenants/${tenant.id}`}>{content}</Link> : <div key={tenant.id}>{content}</div>;
          })}
        </div>
      )}
    </>
  );
}
