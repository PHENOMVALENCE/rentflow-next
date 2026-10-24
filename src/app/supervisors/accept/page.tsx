import { PubIcon } from "@/components/icons";
import { AuthAlert, AuthField, AuthLayout, CodeInput } from "@/components/pub/auth";
import { acceptSupervisorInvite, requestSupervisorInviteOtp } from "@/server/auth/supervisor-invite";
import { decodeSupervisorInviteToken } from "@/server/auth/supervisor-invite-token";
import { maskTanzaniaPhone } from "@/server/auth/phone";

export const metadata = { title: "Supervisor invitation" };

const errors: Record<string, string> = {
  otp_unavailable: "SMS verification is temporarily unavailable. Try again later.",
  pin_mismatch: "The two PIN values must match.",
  identity: "The invited phone/email identity conflicts with an existing account. Ask the organization administrator to review the account.",
  role: "This account already has an incompatible role in the organization.",
  scope: "The property attached to this invitation is no longer available for supervisor assignment.",
};

export default async function AcceptSupervisorPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; sent?: string; resent?: string; remaining?: string }>;
}) {
  const query = await searchParams;
  const token = query.token?.trim() ?? "";
  const payload = token ? decodeSupervisorInviteToken(token) : null;
  const sent = query.sent === "1";
  const valid = Boolean(token && payload && query.error !== "invalid");

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>Join RentFlow</h1>
        <p className="pub-auth-intro">Verify the invited phone number and choose your PIN. RentFlow then attaches the property access selected by the organization.</p>

        <div className="mt-5 grid gap-3 empty:hidden">
          {!valid && <AuthAlert tone="error">This invitation is missing, expired, invalid, or already used.</AuthAlert>}
          {query.error && errors[query.error] && <AuthAlert tone="error">{errors[query.error]}</AuthAlert>}
          {query.error === "code" && <AuthAlert tone="error">The verification code was not accepted.{query.remaining ? ` ${query.remaining} attempt(s) remaining.` : ""}</AuthAlert>}
          {query.resent === "1" && <AuthAlert tone="success">A new verification code was requested.</AuthAlert>}
        </div>

        {valid && payload && (
          <>
            <div className="pub-alert pub-alert-info mt-5">
              <PubIcon name="users" />
              <p><strong>{payload.name}</strong><br />Invited phone: {maskTanzaniaPhone(payload.phone)}</p>
            </div>

            {!sent ? (
              <form action={requestSupervisorInviteOtp} className="pub-auth-form">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="operation" value="request" />
                <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">Send code to my phone</button>
              </form>
            ) : (
              <>
                <form action={acceptSupervisorInvite} className="pub-auth-form">
                  <input type="hidden" name="token" value={token} />
                  <AuthField id="code" label="Code from SMS"><CodeInput id="code" name="code" kind="otp" /></AuthField>
                  <div className="pub-form-grid pub-form-grid-2">
                    <AuthField id="pin" label="New PIN"><CodeInput id="pin" name="pin" autoComplete="new-password" /></AuthField>
                    <AuthField id="confirmPin" label="Confirm PIN"><CodeInput id="confirmPin" name="confirmPin" autoComplete="new-password" /></AuthField>
                  </div>
                  <p className="pub-hint">This is your RentFlow account PIN, not a mobile-money PIN.</p>
                  <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">Save PIN and sign in</button>
                </form>
                <form action={requestSupervisorInviteOtp} className="mt-3">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="operation" value="resend" />
                  <button type="submit" className="pub-btn pub-btn-ghost pub-btn-block"><PubIcon name="refresh" /> Send a new code</button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  );
}
