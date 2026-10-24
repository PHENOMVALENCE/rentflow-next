import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { requestLandlordAttachment } from "@/server/rentflow/attachment-actions";

export default async function JoinLandlordPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!hasDatabaseConfiguration()) notFound();
  const organization = await db.organization.findFirst({ where: { slug: code, active: true } });
  if (!organization) notFound();
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-12">
      <section className="rf-card w-full p-6 lg:p-8">
        <Link href="/" className="text-2xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
        <p className="mt-8 text-sm font-medium uppercase tracking-[.18em] text-[var(--muted)]">Landlord workspace</p>
        <h1 className="mt-3 text-3xl font-semibold">Join {organization.name}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">This request links your RentFlow tenant account to the landlord workspace. The landlord must review the attachment before your tenant record becomes active.</p>
        {!session ? <div className="mt-6 space-y-3"><Link href={`/register?role=TENANT`} className="rf-button rf-button-dark block text-center">Create tenant account</Link><Link href="/login" className="rf-button rf-button-light block text-center">Sign in first</Link></div> : session.role !== "TENANT" ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Only tenant accounts can request attachment to a landlord workspace.</div> : <form action={requestLandlordAttachment} className="mt-6"><input type="hidden" name="organizationId" value={organization.id} /><button type="submit" className="rf-button rf-button-dark w-full">Request landlord attachment</button></form>}
      </section>
    </main>
  );
}
