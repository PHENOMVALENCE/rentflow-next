import Link from "next/link";
import { PubIcon } from "@/components/icons";
import { AuthAlert, AuthField, AuthLayout, CodeInput } from "@/components/pub/auth";
import { resendRegistrationOtp, verifyRegistrationOtp } from "@/server/auth/registration-actions";

export const metadata = { title: "Verify your phone" };

export default async function RegisterVerifyPage({ searchParams }: { searchParams: Promise<{ error?: string; resent?: string }> }) {
  const { error, resent } = await searchParams;
  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>Enter the 4-digit code</h1>
        <p className="pub-auth-intro">The code expires after 10 minutes. Your account is only created after the phone is verified.</p>
        <div className="mt-5 grid gap-3 empty:hidden">
          {resent === "1" && <AuthAlert tone="success">A new verification code was requested.</AuthAlert>}
          {error && <AuthAlert tone="error">The verification code is invalid or expired.</AuthAlert>}
        </div>
        <form action={verifyRegistrationOtp} className="pub-auth-form">
          <AuthField id="otp" label="Code from SMS"><CodeInput id="otp" name="otp" kind="otp" /></AuthField>
          <button className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block" type="submit">Verify and create account</button>
        </form>
        <form action={resendRegistrationOtp} className="mt-3">
          <button type="submit" className="pub-btn pub-btn-ghost pub-btn-block"><PubIcon name="refresh" /> Send a new code</button>
        </form>
        <p className="pub-auth-foot"><Link href="/register" className="pub-link">Change details</Link></p>
      </div>
    </AuthLayout>
  );
}
