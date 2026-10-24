import Link from "next/link";
import { redirect } from "next/navigation";
import { PubIcon } from "@/components/icons";
import { AuthAlert, AuthField, AuthLayout, CodeInput } from "@/components/pub/auth";
import { resendPinResetOtpAction, verifyPinResetAction } from "@/server/auth/pin-recovery-actions";
import { getPinRecoveryState } from "@/server/auth/pin-recovery";
import { maskTanzaniaPhone } from "@/server/auth/phone";
import { getTranslator } from "@/i18n/server";

export const metadata = { title: "Verify and reset PIN" };

export default async function VerifyPinResetPage({ searchParams }: { searchParams: Promise<{ error?: string; remaining?: string; resent?: string }> }) {
  const recovery = await getPinRecoveryState();
  if (!recovery) redirect("/forgot-pin?error=expired");
  const query = await searchParams;
  const { t } = await getTranslator();

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>{t("Choose a new PIN")}</h1>
        <p className="pub-auth-intro">Enter the 4-digit code sent to {maskTanzaniaPhone(recovery.phone)}. Codes expire after 10 minutes.</p>

        <div className="mt-5 grid gap-3 empty:hidden">
          {query.resent === "1" && <AuthAlert tone="success">{t("A new code was requested.")}</AuthAlert>}
          {query.error === "invalid" && <AuthAlert tone="error">{t("Check the code and make sure both PIN fields match.")}</AuthAlert>}
          {query.error === "code" && <AuthAlert tone="error">The code was not accepted.{query.remaining ? ` ${query.remaining} attempt(s) remaining.` : ""}</AuthAlert>}
          {query.error === "unavailable" && <AuthAlert tone="error">{t("SMS verification is temporarily unavailable. Try again later.")}</AuthAlert>}
        </div>

        <form action={verifyPinResetAction} className="pub-auth-form">
          <AuthField id="code" label={t("Code from SMS")}><CodeInput id="code" name="code" kind="otp" /></AuthField>
          <div className="pub-form-grid pub-form-grid-2">
            <AuthField id="pin" label={t("New PIN")}><CodeInput id="pin" name="pin" autoComplete="new-password" /></AuthField>
            <AuthField id="confirmPin" label={t("Confirm new PIN")}><CodeInput id="confirmPin" name="confirmPin" autoComplete="new-password" /></AuthField>
          </div>
          <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">{t("Save PIN")}</button>
        </form>
        <form action={resendPinResetOtpAction} className="mt-3">
          <button type="submit" className="pub-btn pub-btn-ghost pub-btn-block"><PubIcon name="refresh" /> {t("Send a new code")}</button>
        </form>

        <p className="pub-auth-foot"><Link href="/forgot-pin" className="pub-link">{t("Use a different phone number")}</Link></p>
      </div>
    </AuthLayout>
  );
}
