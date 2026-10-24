import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { reviewLandlordAttachment } from "@/server/rentflow/attachment-actions";

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function AttachmentRequestsPage() {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!session.organizationId) notFound();

  const tenants = hasDatabaseConfiguration() ? await db.tenant.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, name: true, phone: true, email: true, status: true },
  }) : [];
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const requests = hasDatabaseConfiguration() ? await db.tenantAttachmentRequest.findMany({
    where: { tenantId: { in: tenants.map((tenant) => tenant.id) }, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  }) : [];

  return (
    <>
      <PageHeader eyebrow="Tenant onboarding" title="Attachment requests" description="Review tenants asking to attach their RentFlow account to this landlord workspace." />
      <div className="rf-card overflow-hidden">
        {requests.length === 0 ? <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No pending attachment requests.</p> : requests.map((request) => {
          const tenant = tenantById.get(request.tenantId);
          return <div key={request.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 lg:grid-cols-[1.2fr_.8fr_auto] lg:items-center"><div><div className="flex items-center gap-2"><p className="font-medium">{tenant?.name ?? "Tenant"}</p><Status>{request.kind.replaceAll("_", " ")}</Status></div><p className="mt-1 text-xs text-[var(--muted)]">{tenant?.phone}{tenant?.email ? ` · ${tenant.email}` : ""}</p></div><div><p className="text-sm">Requested {date.format(request.createdAt)}</p><p className="mt-1 text-xs text-[var(--muted)]">Tenant status: {tenant?.status ?? "Unknown"}</p></div><div className="flex gap-2"><form action={reviewLandlordAttachment}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="refuse" /><button className="rf-button rf-button-light" type="submit">Refuse</button></form><form action={reviewLandlordAttachment}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="approve" /><button className="rf-button rf-button-dark" type="submit">Approve</button></form></div></div>;
        })}
      </div>
    </>
  );
}
