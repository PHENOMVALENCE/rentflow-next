import Link from "next/link";
import { notFound } from "next/navigation";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { requestTenantInviteOtp, verifyTenantInviteOtp } from "@/server/auth/tenant-invite-actions";

export default async function TenantInvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { token } = await params;
  const query = await searchParams;
  if (!hasDatabaseConfiguration()) notFound();
  const invite = await db.shortLink.findUnique({ where: { code: token } });
  if (!invite || !invite.destination.startsWith("tenant-invite:") || (invite.expiresAt && invite.expiresAt <= new Date())) notFound();
  const tenantId = invite.destination.slice("tenant-invite:".length);
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, include: { organization: true } });
  if (!tenant || tenant.userId) notFound();

  const message = query.error === "expired" ? "This invite has expired. Ask the landlord to issue a new one." : query.error === "phone" ? "This tenant record does not have a valid Tanzanian mobile number." : query.error === "otp" ? "The verification code is invalid or expired." : null;

  return <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-12">
    <section className="rf-card w-full p-6 lg:p-8">
      <Link href="/" className="text-2xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
      <p className="mt-8 text-sm font-medium uppercase tracking-[.18em] text-[var(--muted)]">Tenant invitation</p>
      <h1 className="mt-3 text-3xl font-semibold">Join {tenant.organization.name}</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">This invitation is for <strong>{tenant.name}</strong>. RentFlow verifies the mobile number on the tenant record before attaching the account.</p>
      {message && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message}</div>}
      {!query.sent ? <form action={requestTenantInviteOtp} className="mt-6"><input type="hidden" name="token" value={token} /><button className="rf-button rf-button-dark w-full" type="submit">Send verification code</button></form> : <form action={verifyTenantInviteOtp} className="mt-6 space-y-5"><input type="hidden" name="token" value={token} /><label className="block text-sm font-medium">4-digit verification code<input name="otp" required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-center text-2xl tracking-[.45em]" /></label><button className="rf-button rf-button-dark w-full" type="submit">Verify and continue</button><button formAction={requestTenantInviteOtp} className="rf-button rf-button-light w-full" type="submit">Resend code</button></form>}
    </section>
  </main>;
}
