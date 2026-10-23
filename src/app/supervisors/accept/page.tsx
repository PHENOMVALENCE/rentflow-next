import Link from "next/link";
import { acceptSupervisorInvite, requestSupervisorInviteOtp } from "@/server/auth/supervisor-invite";
import { decodeSupervisorInviteToken } from "@/server/rentflow/supervisor-actions";
import { maskTanzaniaPhone } from "@/server/auth/phone";

export default async function AcceptSupervisorPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; sent?: string; resent?: string; remaining?: string }>;
}) {
  const query = await searchParams;
  const token = query.token?.trim() ?? "";
  const payload = token ? decodeSupervisorInviteToken(token) : null;
  const sent = query.sent === "1";

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
        <div className="rf-card mt-10 p-6 sm:p-8">
          <p className="rf-eyebrow">Supervisor onboarding</p>
          <h1 className="text-3xl font-semibold">Join RentFlow</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Verify the invited phone number, choose your 4-digit account PIN, and RentFlow will attach the property access selected by the organization.</p>

          {(query.error === "invalid" || !token || !payload) && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">This invitation is missing, expired, invalid, or already used.</div>
          )}
          {query.error === "otp_unavailable" && <ErrorMessage>SMS verification is temporarily unavailable. Try again later.</ErrorMessage>}
          {query.error === "pin_mismatch" && <ErrorMessage>The two PIN values must match.</ErrorMessage>}
          {query.error === "code" && <ErrorMessage>The verification code was not accepted.{query.remaining ? ` ${query.remaining} attempt(s) remaining.` : ""}</ErrorMessage>}
          {query.error === "identity" && <ErrorMessage>The invited phone/email identity conflicts with an existing account. Ask the organization administrator to review the account.</ErrorMessage>}
          {query.error === "role" && <ErrorMessage>This account already has an incompatible role in the organization.</ErrorMessage>}
          {query.error === "scope" && <ErrorMessage>The property attached to this invitation is no longer available for supervisor assignment.</ErrorMessage>}
          {query.resent === "1" && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">A new verification code was requested.</div>}

          {token && payload && query.error !== "invalid" && (
            <>
              <div className="mt-6 rounded-xl border border-[var(--border)] bg-slate-50 p-4 text-sm">
                <p className="font-medium">{payload.name}</p>
                <p className="mt-1 text-[var(--muted-strong)]">Invited phone: {maskTanzaniaPhone(payload.phone)}</p>
              </div>

              {!sent ? (
                <form action={requestSupervisorInviteOtp} className="mt-6">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="operation" value="request" />
                  <button type="submit" className="rf-button rf-button-dark w-full">Send code to my phone</button>
                </form>
              ) : (
                <>
                  <form action={acceptSupervisorInvite} className="mt-6 space-y-5">
                    <input type="hidden" name="token" value={token} />
                    <label className="block text-sm font-medium">Verification code<input required name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /></label>
                    <label className="block text-sm font-medium">New 4-digit PIN<input required name="pin" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /><span className="mt-1 block text-xs text-[var(--muted)]">This is your RentFlow account PIN, not a mobile-money PIN.</span></label>
                    <label className="block text-sm font-medium">Confirm PIN<input required name="confirmPin" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /></label>
                    <button type="submit" className="rf-button rf-button-dark w-full">Save PIN and sign in</button>
                  </form>

                  <form action={requestSupervisorInviteOtp} className="mt-4">
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="operation" value="resend" />
                    <button type="submit" className="rf-button rf-button-light w-full">Resend code</button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{children}</div>;
}
