import Link from "next/link";
import { PubIcon } from "@/components/icons";
import { AuthAlert, AuthField, AuthLayout } from "@/components/pub/auth";
import { requestPinResetAction } from "@/server/auth/pin-recovery-actions";
import { getTranslator } from "@/i18n/server";

export const metadata = { title: "Reset your PIN" };

export default async function ForgotPinPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const { t } = await getTranslator();

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>{t("Choose a new PIN")}</h1>
        <p className="pub-auth-intro">{t("We text a 4-digit code to the phone on your account. Enter it, then choose a new PIN.")}</p>

        <div className="mt-5 grid gap-3 empty:hidden">
          {query.error === "invalid" && <AuthAlert tone="error">{t("Enter a valid Tanzanian phone number.")}</AuthAlert>}
          {query.error === "expired" && <AuthAlert tone="error">{t("The recovery session expired. Request a new code.")}</AuthAlert>}
          {query.error === "unavailable" && <AuthAlert tone="error">{t("SMS verification is temporarily unavailable. Try again later.")}</AuthAlert>}
        </div>

        <form action={requestPinResetAction} className="pub-auth-form">
          <AuthField id="phone" label={t("Phone number")}>
            <div className="pub-input-group">
              <PubIcon name="phone" />
              <input id="phone" type="tel" inputMode="tel" name="phone" className="pub-input" placeholder="0712 000 000" autoComplete="tel" required />
            </div>
          </AuthField>
          <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">{t("Send code")}</button>
        </form>

        <p className="pub-auth-foot"><Link href="/login" className="pub-link">{t("Back to sign in")}</Link></p>
      </div>
    </AuthLayout>
  );
}
