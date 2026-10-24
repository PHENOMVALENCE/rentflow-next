import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { updateTenant } from "@/server/rentflow/tenant-actions";

export default async function TenantEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  if (!hasDatabaseConfiguration()) notFound();
  const tenant = await db.tenant.findFirst({ where: { id, ...(session.organizationId ? { organizationId: session.organizationId } : {}) } });
  if (!tenant) notFound();
  return <><PageHeader eyebrow="Tenant" title={`Edit ${tenant.name}`} description="Update tenant identity and account state." action={<Link href={`/app/tenants/${tenant.id}`} className="rf-button rf-button-light">Cancel</Link>} /><form action={updateTenant} className="rf-card max-w-3xl space-y-5 p-6"><input type="hidden" name="tenantId" value={tenant.id} /><label className="block text-sm font-medium">Full name<input name="name" required defaultValue={tenant.name} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Phone<input name="phone" required defaultValue={tenant.phone} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Email<input name="email" type="email" defaultValue={tenant.email ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label></div><label className="block text-sm font-medium">Status<select name="status" defaultValue={tenant.status} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING_ATTACHMENT">Pending attachment</option><option value="REFUSED">Refused</option></select></label><button className="rf-button rf-button-dark">Save tenant</button></form></>;
}
