import Link from "next/link";
import { requestRegistrationOtp } from "@/server/auth/registration-actions";

const errorMessages: Record<string, string> = {
  invalid: "Check the form details and try again.",
  phone: "Use a valid Tanzanian mobile number.",
  expired: "Your registration session expired. Start again.",
  persistence: "Registration is unavailable until persistent storage is configured.",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; role?: string }> }) {
  const { error, role } = await searchParams;
  const defaultRole = role === "LANDLORD" ? "LANDLORD" : "TENANT";
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <section className="pt-6"><Link href="/" className="text-2xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link><p className="mt-8 text-sm font-medium uppercase tracking-[.18em] text-[var(--muted)]">Create account</p><h1 className="mt-3 max-w-lg text-4xl font-semibold tracking-tight">Start as a tenant or property owner.</h1><p className="mt-4 max-w-lg text-[var(--muted-strong)]">Your phone is verified by OTP before the account is created. A four-digit PIN is used for sign-in.</p></section>
        <section className="rf-card p-6 lg:p-8">
          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errorMessages[error] ?? "Registration could not continue."}</div>}
          <form action={requestRegistrationOtp} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Full name<input name="name" required minLength={2} maxLength={255} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Phone<input name="phone" required inputMode="tel" placeholder="0712 000 000" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label></div>
            <label className="block text-sm font-medium">Email <span className="font-normal text-[var(--muted)]">(optional)</span><input name="email" type="email" maxLength={255} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
            <div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">4-digit PIN<input name="pin" required type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label><label className="text-sm font-medium">Confirm PIN<input name="pinConfirmation" required type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label></div>
            <fieldset><legend className="text-sm font-medium">Account type</legend><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="rounded-xl border border-[var(--border)] p-4 text-sm"><input type="radio" name="role" value="TENANT" defaultChecked={defaultRole === "TENANT"} className="mr-2" />Tenant</label><label className="rounded-xl border border-[var(--border)] p-4 text-sm"><input type="radio" name="role" value="LANDLORD" defaultChecked={defaultRole === "LANDLORD"} className="mr-2" />Property owner / landlord</label></div></fieldset>
            <label className="block text-sm font-medium">Organization / portfolio name <span className="font-normal text-[var(--muted)]">(required for landlords)</span><input name="organizationName" maxLength={255} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
            <button type="submit" className="rf-button rf-button-dark w-full">Send verification code</button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--muted-strong)]">Already registered? <Link href="/login" className="font-medium text-black">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
