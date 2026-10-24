import Link from "next/link";
import { PubIcon } from "@/components/icons";
import { AuthAlert, AuthField, AuthLayout } from "@/components/pub/auth";
import { requestPinResetAction } from "@/server/auth/pin-recovery-actions";

export const metadata = { title: "Reset your PIN" };

export default async function ForgotPinPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>Choose a new PIN</h1>
        <p className="pub-auth-intro">We text a 4-digit code to the phone on your account. Enter it, then choose a new PIN.</p>

        <div className="mt-5 grid gap-3 empty:hidden">
          {query.error === "invalid" && <AuthAlert tone="error">Enter a valid Tanzanian phone number.</AuthAlert>}
          {query.error === "expired" && <AuthAlert tone="error">The recovery session expired. Request a new code.</AuthAlert>}
          {query.error === "unavailable" && <AuthAlert tone="error">SMS verification is temporarily unavailable. Try again later.</AuthAlert>}
        </div>

        <form action={requestPinResetAction} className="pub-auth-form">
          <AuthField id="phone" label="Phone number">
            <div className="pub-input-group">
              <PubIcon name="phone" />
              <input id="phone" type="tel" inputMode="tel" name="phone" className="pub-input" placeholder="0712 000 000" autoComplete="tel" required />
            </div>
          </AuthField>
          <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">Send code</button>
        </form>

        <p className="pub-auth-foot"><Link href="/login" className="pub-link">Back to sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
