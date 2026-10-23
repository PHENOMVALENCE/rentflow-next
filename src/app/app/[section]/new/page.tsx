import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { createProperty, createUnit } from "@/server/rentflow/property-actions";
import { createTenant, createLease } from "@/server/rentflow/lease-actions";
import { saveListing } from "@/server/rentflow/listing-actions";
import { createMaintenanceRequest } from "@/server/rentflow/maintenance-actions";
import { publishSafetyNotice } from "@/server/rentflow/notice-actions";

const supported = ["properties", "units", "tenants", "leases", "listings", "maintenance", "notices"] as const;
type SupportedSection = (typeof supported)[number];

const titles: Record<SupportedSection, string> = {
  properties: "Add property",
  units: "Add unit",
  tenants: "Add tenant",
  leases: "Create lease",
  listings: "Prepare listing",
  maintenance: "Report maintenance",
  notices: "Publish notice",
};

export default async function NewRecordPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: rawSection } = await params;
  if (!supported.includes(rawSection as SupportedSection)) notFound();
  const section = rawSection as SupportedSection;
  const session = await requireSession();

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Operations" title={titles[section]} description="This write workflow is implemented but requires the production database." />
        <div className="rf-card max-w-2xl p-6">
          <h2 className="font-semibold">Persistence is not connected</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Configure DATABASE_URL and deploy the Prisma migration before creating authoritative operational records. Preview data is intentionally read-only.</p>
          <Link href={`/app/${section}`} className="rf-button rf-button-light mt-5">Back to {section}</Link>
        </div>
      </>
    );
  }

  if (!session.organizationId && session.role !== "PLATFORM_ADMIN") {
    throw new Error("Your account is not attached to an organization.");
  }

  const organizationId = session.organizationId;
  const properties = await db.property.findMany({
    where: organizationId ? { organizationId, active: true } : { active: true },
    orderBy: { name: "asc" },
  });
  const units = await db.unit.findMany({
    where: organizationId ? { property: { organizationId } } : undefined,
    include: { property: true, leases: true },
    orderBy: [{ property: { name: "asc" } }, { unitNumber: "asc" }],
  });
  const tenants = await db.tenant.findMany({
    where: organizationId ? { organizationId } : undefined,
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader eyebrow="Operations" title={titles[section]} description="Create an authoritative RentFlow operational record." />
      <div className="max-w-3xl">{renderForm(section, { properties, units, tenants })}</div>
    </>
  );
}

type Options = {
  properties: Array<{ id: string; name: string }>;
  units: Array<{ id: string; unitNumber: string; property: { name: string }; leases: Array<{ status: string }> }>;
  tenants: Array<{ id: string; name: string; phone: string }>;
};

function renderForm(section: SupportedSection, options: Options) {
  if (section === "properties") {
    return (
      <Form action={createProperty} submit="Create property">
        <Field name="name" label="Property name" required />
        <Select name="type" label="Property type" options={[["RESIDENTIAL", "Residential"], ["COMMERCIAL", "Commercial"], ["MIXED_USE", "Mixed use"]]} />
        <Field name="address" label="Official address" required />
        <div className="grid gap-5 sm:grid-cols-2"><Field name="region" label="Region" required /><Field name="district" label="District" required /></div>
        <Field name="ward" label="Ward" />
      </Form>
    );
  }

  if (section === "units") {
    return (
      <Form action={createUnit} submit="Create unit">
        <Select name="propertyId" label="Property" options={options.properties.map((item) => [item.id, item.name])} />
        <div className="grid gap-5 sm:grid-cols-2"><Field name="unitNumber" label="Unit number" required /><Select name="type" label="Unit type" options={[["APARTMENT", "Apartment"], ["SHOP", "Shop"], ["OFFICE", "Office"], ["STORE", "Store"], ["OTHER", "Other"]]} /></div>
        <Field name="monthlyRent" label="Monthly rent (TZS)" type="number" min="0" required />
        <div className="grid gap-5 sm:grid-cols-3"><Field name="floor" label="Floor" /><Field name="bedrooms" label="Bedrooms" type="number" min="0" /><Field name="bathrooms" label="Bathrooms" type="number" min="0" /></div>
      </Form>
    );
  }

  if (section === "tenants") {
    return (
      <Form action={createTenant} submit="Create tenant">
        <Field name="name" label="Full name" required />
        <div className="grid gap-5 sm:grid-cols-2"><Field name="phone" label="Phone" required /><Field name="email" label="Email" type="email" /></div>
      </Form>
    );
  }

  if (section === "leases") {
    const availableUnits = options.units.filter((unit) => !unit.leases.some((lease) => ["AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE"].includes(lease.status)));
    return (
      <Form action={createLease} submit="Create lease & obligation">
        <Select name="unitId" label="Available unit" options={availableUnits.map((unit) => [unit.id, `${unit.property.name} · ${unit.unitNumber}`])} />
        <Select name="tenantId" label="Tenant" options={options.tenants.map((tenant) => [tenant.id, `${tenant.name} · ${tenant.phone}`])} />
        <div className="grid gap-5 sm:grid-cols-2"><Select name="termMonths" label="Initial term" options={[["3", "3 months"], ["6", "6 months"]]} /><Field name="startDate" label="Start date" type="date" required /></div>
        <p className="text-xs leading-5 text-[var(--muted)]">The exact full-term obligation is calculated from the unit monthly rent. The lease remains awaiting payment until a verified exact provider callback settles it.</p>
      </Form>
    );
  }

  if (section === "listings") {
    return (
      <Form action={saveListing} submit="Save listing">
        <Select name="unitId" label="Unit" options={options.units.map((unit) => [unit.id, `${unit.property.name} · ${unit.unitNumber}`])} />
        <Field name="title" label="Public title" required />
        <TextArea name="description" label="Public description" required />
        <p className="text-xs leading-5 text-[var(--muted)]">If the unit has a protected lease relationship, RentFlow saves the listing as blocked instead of publishing it.</p>
      </Form>
    );
  }

  if (section === "maintenance") {
    return (
      <Form action={createMaintenanceRequest} submit="Report request">
        <Select name="propertyId" label="Property" options={options.properties.map((item) => [item.id, item.name])} />
        <Select name="unitId" label="Unit (optional)" allowEmpty options={options.units.map((unit) => [unit.id, `${unit.property.name} · ${unit.unitNumber}`])} />
        <Select name="tenantId" label="Reported by tenant" options={options.tenants.map((tenant) => [tenant.id, tenant.name])} />
        <Field name="title" label="Issue title" required />
        <TextArea name="description" label="Description" required />
        <Select name="priority" label="Priority" options={[["LOW", "Low"], ["MEDIUM", "Medium"], ["HIGH", "High"], ["URGENT", "Urgent"]]} />
      </Form>
    );
  }

  return (
    <Form action={publishSafetyNotice} submit="Publish notice">
      <Select name="propertyId" label="Property scope" allowEmpty emptyLabel="Organization-wide" options={options.properties.map((item) => [item.id, item.name])} />
      <Field name="title" label="Notice title" required />
      <TextArea name="body" label="Notice body" required />
      <div className="grid gap-5 sm:grid-cols-2"><Select name="severity" label="Severity" options={[["INFO", "Info"], ["WARNING", "Warning"], ["CRITICAL", "Critical"]]} /><Field name="expiresAt" label="Expires at" type="datetime-local" /></div>
    </Form>
  );
}

function Form({ action, submit, children }: { action: (formData: FormData) => void | Promise<void>; submit: string; children: React.ReactNode }) {
  return <form action={action} className="rf-card space-y-5 p-6">{children}<div className="flex items-center gap-3 pt-2"><button className="rf-button rf-button-dark" type="submit">{submit}</button></div></form>;
}

function Field({ name, label, type = "text", required = false, min }: { name: string; label: string; type?: string; required?: boolean; min?: string }) {
  return <label className="block text-sm font-medium">{label}<input name={name} type={type} required={required} min={min} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>;
}

function TextArea({ name, label, required = false }: { name: string; label: string; required?: boolean }) {
  return <label className="block text-sm font-medium">{label}<textarea name={name} rows={6} required={required} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>;
}

function Select({ name, label, options, allowEmpty = false, emptyLabel = "None" }: { name: string; label: string; options: Array<[string, string]>; allowEmpty?: boolean; emptyLabel?: string }) {
  return <label className="block text-sm font-medium">{label}<select name={name} required={!allowEmpty} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3">{allowEmpty && <option value="">{emptyLabel}</option>}{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
}
