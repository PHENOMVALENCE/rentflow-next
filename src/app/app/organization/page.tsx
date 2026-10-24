import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { updateOrganizationBranding } from "@/server/rentflow/organization-actions";

export default async function OrganizationPage() {
  const session = await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  if (!session.organizationId) notFound();

  if (!hasDatabaseConfiguration()) {
    return <><PageHeader eyebrow="Organization" title="Organization details" description="Branding settings require persistent storage." /><div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">Connect the production database to manage organization details.</div></>;
  }

  const organization = await db.organization.findUnique({ where: { id: session.organizationId } });
  if (!organization) notFound();
  const settings = organization.settings && typeof organization.settings === "object" && !Array.isArray(organization.settings) ? organization.settings as Record<string, unknown> : {};
  const branding = settings.branding && typeof settings.branding === "object" && !Array.isArray(settings.branding) ? settings.branding as Record<string, string> : {};

  return (
    <>
      <PageHeader eyebrow="Organization" title="Organization details" description="Workspace identity used across operational views, reports and exports." />
      <form action={updateOrganizationBranding} className="rf-card max-w-3xl space-y-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium">Organization name<input name="name" required minLength={2} maxLength={255} defaultValue={organization.name} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
          <label className="text-sm font-medium">TIN<input name="tin" maxLength={32} defaultValue={branding.tin ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
          <label className="text-sm font-medium md:col-span-2">Postal address<input name="postalAddress" maxLength={255} defaultValue={branding.postalAddress ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
          <label className="text-sm font-medium">Contact phone<input name="contactPhone" maxLength={32} defaultValue={branding.contactPhone ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
          <label className="text-sm font-medium">Contact email<input name="contactEmail" type="email" maxLength={255} defaultValue={branding.contactEmail ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        </div>
        <div className="border-t border-[var(--border)] pt-5"><button type="submit" className="rf-button rf-button-dark">Save organization details</button></div>
      </form>
    </>
  );
}
