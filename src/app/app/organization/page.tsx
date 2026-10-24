import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { updateOrganizationBranding, uploadOrganizationLogo } from "@/server/rentflow/organization-actions";
import { hasPrivateObjectStorage } from "@/server/storage/private-object-store";

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
  const hasLogo = Boolean(branding.logoStorageKey);

  return (
    <>
      <PageHeader eyebrow="Organization" title="Organization details" description="Workspace identity used across operational views, reports and exports." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <form action={updateOrganizationBranding} className="rf-card space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-medium">Organization name<input name="name" required minLength={2} maxLength={255} defaultValue={organization.name} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
            <label className="text-sm font-medium">TIN<input name="tin" maxLength={32} defaultValue={branding.tin ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
            <label className="text-sm font-medium md:col-span-2">Postal address<input name="postalAddress" maxLength={255} defaultValue={branding.postalAddress ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
            <label className="text-sm font-medium">Contact phone<input name="contactPhone" maxLength={32} defaultValue={branding.contactPhone ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
            <label className="text-sm font-medium">Contact email<input name="contactEmail" type="email" maxLength={255} defaultValue={branding.contactEmail ?? ""} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
          </div>
          <div className="border-t border-[var(--border)] pt-5"><button type="submit" className="rf-button rf-button-dark">Save organization details</button></div>
        </form>
        <section className="rf-card h-fit p-6">
          <h2 className="font-semibold">Organization logo</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Upload the private source logo used by authorized organization views and generated outputs.</p>
          {hasLogo && <div className="mt-4"><Link href="/app/organization/logo" target="_blank" className="text-sm font-medium">Open current logo →</Link><p className="mt-1 text-xs text-[var(--muted)]">{branding.logoFileName ?? "Stored logo"}</p></div>}
          {!hasPrivateObjectStorage() && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Private storage must be configured before logo uploads are enabled.</div>}
          <form action={uploadOrganizationLogo} className="mt-5 space-y-4"><input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" required disabled={!hasPrivateObjectStorage()} className="block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm" /><button type="submit" disabled={!hasPrivateObjectStorage()} className="rf-button rf-button-dark">{hasLogo ? "Replace logo" : "Upload logo"}</button></form>
        </section>
      </div>
    </>
  );
}
