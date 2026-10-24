import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { issueTenantInvite } from "@/server/auth/tenant-invite-actions";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

export default async function TenantInviteManagementPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
  const { id } = await params;
  const { token } = await searchParams;
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!hasDatabaseConfiguration()) notFound();
  const tenant = await db.tenant.findFirst({ where: { id, ...(session.organizationId ? { organizationId: session.organizationId } : {}) }, include: { organization: true } });
  if (!tenant) notFound();
  const relativeInvite = token ? `/invite/${token}` : null;

  return <>
    <PageHeader eyebrow="Tenant onboarding" title={`Invite ${tenant.name}`} description={`Attach a verified tenant login to ${tenant.organization.name}.`} action={<Link href={`/app/tenants/${tenant.id}`} className="rf-button rf-button-light">Back to tenant</Link>} />
    <section className="rf-card max-w-3xl p-6">
      {tenant.userId ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">This tenant already has a linked RentFlow account.</div> : relativeInvite ? <div className="space-y-5"><div><p className="text-sm font-medium">Invite link</p><p className="mt-1 text-xs text-[var(--muted)]">Valid for 48 hours. Issuing another link invalidates this one.</p></div><code className="block break-all rounded-xl bg-slate-950 p-4 text-sm text-white">{relativeInvite}</code><div className="flex flex-wrap gap-3"><Link href={relativeInvite} className="rf-button rf-button-dark">Open invite</Link><form action={issueTenantInvite}><input type="hidden" name="tenantId" value={tenant.id} /><button className="rf-button rf-button-light" type="submit">Replace invite</button></form></div></div> : <div><p className="text-sm leading-6 text-[var(--muted-strong)]">Generate a one-time onboarding link. The tenant must verify the phone number on this record using Briq OTP before RentFlow attaches the login.</p><form action={issueTenantInvite} className="mt-5"><input type="hidden" name="tenantId" value={tenant.id} /><button className="rf-button rf-button-dark" type="submit">Generate tenant invite</button></form></div>}
    </section>
  </>;
}
