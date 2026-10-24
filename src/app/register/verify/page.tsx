import Link from "next/link";
import { resendRegistrationOtp, verifyRegistrationOtp } from "@/server/auth/registration-actions";

export default async function RegisterVerifyPage({ searchParams }: { searchParams: Promise<{ error?: string; resent?: string }> }) {
  const { error, resent } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-12">
      <section className="rf-card w-full p-6 lg:p-8">
        <Link href="/" className="text-2xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
        <p className="mt-8 text-sm font-medium uppercase tracking-[.18em] text-[var(--muted)]">Phone verification</p>
        <h1 className="mt-3 text-3xl font-semibold">Enter the 4-digit code</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">The code expires after 10 minutes. Your account is only created after successful verification.</p>
        {resent === "1" && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">A new verification code was requested.</div>}
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">The verification code is invalid or expired.</div>}
        <form action={verifyRegistrationOtp} className="mt-6 space-y-5"><label className="block text-sm font-medium">Verification code<input name="otp" required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="one-time-code" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-center text-2xl tracking-[.45em]" /></label><button className="rf-button rf-button-dark w-full" type="submit">Verify and create account</button></form>
        <div className="mt-5 flex items-center justify-between gap-4 text-sm"><form action={resendRegistrationOtp}><button type="submit" className="font-medium">Resend code</button></form><Link href="/register" className="text-[var(--muted-strong)]">Change details</Link></div>
      </section>
    </main>
  );
}
