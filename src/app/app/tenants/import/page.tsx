import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { importExistingPortfolio } from "@/server/rentflow/portfolio-import-actions";

const sample = `property_name,ward_postcode,street_village,property_type,unit_number,unit_type,indicative_monthly_rent,tenant_name,phone,term_months,full_term_amount,start_date,already_paid
Ocean View,14101,Masaki,RESIDENTIAL,A2,APARTMENT,850000,Rehema K,0712000000,6,5100000,2026-10-01,no`;

export default async function PortfolioImportPage({ searchParams }: { searchParams: Promise<{ imported?: string; errors?: string }> }) {
  await requireSession(["LANDLORD", "PROPERTY_ADMIN", "PLATFORM_ADMIN"]);
  const { imported, errors } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Portfolio" title="Import existing records" description="Import existing property, unit, tenant and lease records from CSV. Occupancy is still derived from lease state." action={<Link href="/app/tenants" className="rf-button rf-button-light">Back to tenants</Link>} />
      {imported !== undefined && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Imported {imported} row(s).{errors ? " Some rows need correction below." : ""}</div>}
      {errors && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{errors}</div>}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <form action={importExistingPortfolio} className="rf-card space-y-5 p-6">
          <label className="block text-sm font-medium">CSV rows<textarea name="csv" required rows={16} placeholder={sample} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-xs leading-6" /></label>
          <p className="text-xs leading-5 text-[var(--muted)]">Required columns: property_name, ward_postcode, unit_number, tenant_name, term_months and full_term_amount. Ward postcode/code must already exist in RentFlow geography. Use already_paid=yes only for a term already settled outside RentFlow.</p>
          <button className="rf-button rf-button-dark" type="submit">Import portfolio</button>
        </form>
        <section className="rf-card h-fit p-6"><h2 className="font-semibold">CSV template</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Paste rows using the same headings as the Laravel migration workflow.</p><pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-white">{sample}</pre><div className="mt-5 text-xs leading-5 text-[var(--muted)]">Each row is imported in its own transaction. Invalid rows are rejected without rolling back valid rows.</div></section>
      </div>
    </>
  );
}
