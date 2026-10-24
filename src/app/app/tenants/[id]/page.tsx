import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { resetManagedAccountPinAction } from "@/server/auth/operator-pin-actions";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { cancelTenantAttachmentRequest, requestTenantAttachment, updateTenantProfile } from "@/server/rentflow/tenant-profile-actions";
import { getTenantManagementDetail } from "@/server/rentflow/tenant-read-model";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export default async function TenantDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pinReset?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);

  if (!hasDatabaseConfiguration()) {
    return <><PageHeader eyebrow="Tenants" title="Tenant record" description="Tenant management requires the production database." action={<Link href="/app/tenants" className="rf-button rf-button-light">Back</Link>} /><div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">Preview tenant records are read-only.</div></>;
  }

  const result = await getTenantManagementDetail(id, session.organizationId);
  if (!result) notFound();
  const { tenant, attachmentRequests } = result;

  return (
    <>
      <PageHeader eyebrow="Tenants" title={tenant.name} description={`${tenant.phone}${tenant.email ? ` · ${tenant.email}` : ""}`} action={<div className="flex flex-wrap gap-2"><Link href="/app/tenants" className="rf-button rf-button-light">Back</Link><Link href={`/app/tenants/${tenant.id}/edit`} className="rf-button rf-button-light">Edit</Link><Link href={`/app/tenants/${tenant.id}/tenancies/create`} className="rf-button rf-button-light">Create tenancy</Link>{!tenant.userId && <Link href={`/app/tenants/${tenant.id}/invite`} className="rf-button rf-button-dark">Invite tenant</Link>}</div>} />

      {query.pinReset === "1" && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">The tenant account PIN was invalidated. They must verify their phone and choose a new PIN before using PIN sign-in again.</div>}
      {query.error === "pin_reset_denied" && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">This account cannot be reset from the current organization context.</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rf-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-semibold">Tenant profile</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Sensitive identity data is minimized. RentFlow stores only the final four national-ID digits in this profile.</p></div>{tenant.userId && <form action={resetManagedAccountPinAction}><input type="hidden" name="targetUserId" value={tenant.userId} /><input type="hidden" name="returnPath" value={`/app/tenants/${tenant.id}`} /><button type="submit" className="rf-button rf-button-light">Reset account PIN</button></form>}</div>
          <form action={updateTenantProfile} className="mt-5 space-y-5"><input type="hidden" name="tenantId" value={tenant.id} /><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">National ID last 4<input name="nationalIdLast4" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} defaultValue={tenant.profile?.nationalIdLast4 ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label><label className="block text-sm font-medium">Household size<input name="householdSize" type="number" min="1" max="50" defaultValue={tenant.profile?.householdSize ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label></div><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">Emergency contact<input name="emergencyName" defaultValue={tenant.profile?.emergencyName ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label><label className="block text-sm font-medium">Emergency phone<input name="emergencyPhone" defaultValue={tenant.profile?.emergencyPhone ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label></div><label className="block text-sm font-medium">Operational notes<textarea name="notes" rows={4} maxLength={2000} defaultValue={tenant.profile?.notes?.startsWith("ONBOARDING_JSON:") ? "" : tenant.profile?.notes ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label><button type="submit" className="rf-button rf-button-dark">Save profile</button></form>
        </section>
        <section className="rf-card p-6"><h2 className="font-semibold">Request an attachment</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Create a follow-up request for tenant documentation.</p><form action={requestTenantAttachment} className="mt-5 space-y-5"><input type="hidden" name="tenantId" value={tenant.id} /><label className="block text-sm font-medium">Document/request type<input name="kind" required placeholder="e.g. Proof of identity" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label><label className="block text-sm font-medium">Due date<input name="dueAt" type="date" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label><button type="submit" className="rf-button rf-button-dark">Create request</button></form></section>
      </div>

      <section className="rf-card mt-6 overflow-hidden"><div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Lease history</h2></div>{tenant.leases.length === 0 ? <p className="p-5 text-sm text-[var(--muted-strong)]">No leases recorded.</p> : tenant.leases.map((lease) => <Link key={lease.id} href={`/app/leases/${lease.id}`} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-medium">{lease.unit.property.name} · {lease.unit.unitNumber}</p><p className="mt-1 text-xs text-[var(--muted)]">{lease.termMonths} months · {date.format(lease.startDate)} – {date.format(lease.endDate)}</p></div><Status>{lease.status.replaceAll("_", " ")}</Status></Link>)}</section>

      <section className="rf-card mt-6 overflow-hidden"><div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Attachment requests</h2></div>{attachmentRequests.length === 0 ? <p className="p-5 text-sm text-[var(--muted-strong)]">No attachment requests.</p> : attachmentRequests.map((request) => <div key={request.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium">{request.kind}</p><p className="mt-1 text-xs text-[var(--muted)]">Requested {date.format(request.createdAt)}{request.dueAt ? ` · due ${date.format(request.dueAt)}` : ""}</p></div><Status>{request.status}</Status>{request.status === "PENDING" && <form action={cancelTenantAttachmentRequest}><input type="hidden" name="requestId" value={request.id} /><button type="submit" className="rf-button rf-button-light">Cancel</button></form>}</div>)}</section>
    </>
  );
}
