import Link from "next/link";
import { redirect } from "next/navigation";
import { resendPinResetOtpAction, verifyPinResetAction } from "@/server/auth/pin-recovery-actions";
import { getPinRecoveryState } from "@/server/auth/pin-recovery";
import { maskTanzaniaPhone } from "@/server/auth/phone";

export default async function VerifyPinResetPage({ searchParams }: { searchParams: Promise<{ error?: string; remaining?: string; resent?: string }> }) {
  const recovery = await getPinRecoveryState();
  if (!recovery) redirect("/forgot-pin?error=expired");
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
        <div className="rf-card mt-10 p-6 sm:p-8">
          <p className="rf-eyebrow">Verify identity</p>
          <h1 className="text-3xl font-semibold">Choose a new PIN</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Enter the 4-digit code sent to {maskTanzaniaPhone(recovery.phone)}, then choose a new 4-digit account PIN.</p>

          {query.resent === "1" && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">A new verification code was requested.</div>}
          {query.error === "invalid" && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Check the code and make sure both PIN fields match.</div>}
          {query.error === "code" && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">The verification code was not accepted.{query.remaining ? ` ${query.remaining} attempt(s) remaining.` : ""}</div>}
          {query.error === "unavailable" && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">SMS verification is temporarily unavailable. Try again later.</div>}

          <form action={verifyPinResetAction} className="mt-6 space-y-5">
            <label className="block text-sm font-medium">Verification code<input required name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /></label>
            <label className="block text-sm font-medium">New 4-digit PIN<input required type="password" name="pin" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /></label>
            <label className="block text-sm font-medium">Confirm PIN<input required type="password" name="confirmPin" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /></label>
            <button type="submit" className="rf-button rf-button-dark w-full">Reset PIN</button>
          </form>

          <form action={resendPinResetOtpAction} className="mt-4"><button type="submit" className="rf-button rf-button-light w-full">Resend code</button></form>
          <div className="mt-5"><Link href="/forgot-pin" className="text-sm font-medium">Use a different phone number</Link></div>
        </div>
      </div>
    </main>
  );
}
