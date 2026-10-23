import Link from "next/link";
import { requestPinResetAction } from "@/server/auth/pin-recovery-actions";

export default async function ForgotPinPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
        <div className="rf-card mt-10 p-6 sm:p-8">
          <p className="rf-eyebrow">Account recovery</p>
          <h1 className="text-3xl font-semibold">Reset your PIN</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Enter the phone number attached to your RentFlow account. If the account is eligible, a 4-digit verification code will be sent by SMS.</p>

          {query.error === "invalid" && <Message tone="error">Enter a valid Tanzanian phone number.</Message>}
          {query.error === "expired" && <Message tone="warning">The recovery session expired. Request a new verification code.</Message>}
          {query.error === "unavailable" && <Message tone="error">SMS verification is temporarily unavailable. Try again later.</Message>}

          <form action={requestPinResetAction} className="mt-6 space-y-5">
            <label className="block text-sm font-medium">Phone number<input required type="tel" name="phone" autoComplete="tel" placeholder="0712 345 678" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>
            <button type="submit" className="rf-button rf-button-dark w-full">Send verification code</button>
          </form>

          <div className="mt-5"><Link href="/login" className="text-sm font-medium">← Back to sign in</Link></div>
        </div>
      </div>
    </main>
  );
}

function Message({ children, tone }: { children: React.ReactNode; tone: "error" | "warning" }) {
  const className = tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900";
  return <div className={`mt-5 rounded-xl border p-3 text-sm ${className}`}>{children}</div>;
}
