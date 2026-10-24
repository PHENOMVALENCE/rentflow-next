import { AuthAlert, AuthField, AuthLayout, CodeInput } from "@/components/pub/auth";
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

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>Join {tenant.organization.name}</h1>
        <p className="pub-auth-intro">This invitation is for <strong>{tenant.name}</strong>. RentFlow verifies the mobile number on the tenant record before attaching the account.</p>
        {message && <div className="mt-5"><AuthAlert tone="error">{message}</AuthAlert></div>}
        {!query.sent ? (
          <form action={requestTenantInviteOtp} className="pub-auth-form">
            <input type="hidden" name="token" value={token} />
            <button className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block" type="submit">Send verification code</button>
          </form>
        ) : (
          <form action={verifyTenantInviteOtp} className="pub-auth-form">
            <input type="hidden" name="token" value={token} />
            <AuthField id="otp" label="Code from SMS"><CodeInput id="otp" name="otp" kind="otp" /></AuthField>
            <button className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block" type="submit">Verify and continue</button>
            <button formAction={requestTenantInviteOtp} formNoValidate className="pub-btn pub-btn-ghost pub-btn-block" type="submit">Send a new code</button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
