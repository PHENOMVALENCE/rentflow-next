import Link from "next/link";
import { PubIcon } from "@/components/icons";
import { AuthAlert, AuthField, AuthLayout, CodeInput } from "@/components/pub/auth";
import { loginAction } from "@/server/auth/actions";
import { hasDatabaseConfiguration } from "@/server/db";
import { getTranslator } from "@/i18n/server";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string }> }) {
  const query = await searchParams;
  const databaseReady = hasDatabaseConfiguration();
  const { t } = await getTranslator();

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>{t("Sign in")}</h1>
        <p className="pub-auth-intro">{t("Enter your phone number and PIN.")}</p>

        <div className="mt-5 grid gap-3 empty:hidden">
          {query.reset === "1" && <AuthAlert tone="success">{t("Your account PIN was reset. Sign in with the new PIN.")}</AuthAlert>}
          {query.error === "invalid" && <AuthAlert tone="error">{t("Invalid phone number or PIN.")}</AuthAlert>}
          {query.error === "locked" && <AuthAlert tone="error">{t("Too many unsuccessful PIN attempts. Reset your PIN by SMS, or try again after the security window.")}</AuthAlert>}
          {!databaseReady && <AuthAlert>{t("Database sign-in is not configured yet. The preview dashboard is available in demo mode.")}</AuthAlert>}
        </div>

        {databaseReady ? (
          <form action={loginAction} className="pub-auth-form">
            <AuthField id="phone" label={t("Phone number")}>
              <div className="pub-input-group">
                <PubIcon name="phone" />
                <input id="phone" type="tel" inputMode="tel" name="phone" className="pub-input" placeholder="0712 000 000" autoComplete="tel" required />
              </div>
            </AuthField>
            <AuthField id="pin" label={t("PIN")}>
              <CodeInput id="pin" name="pin" />
            </AuthField>
            <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">{t("Sign in")}</button>
          </form>
        ) : (
          <div className="pub-auth-form">
            <Link href="/app" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">{t("Open preview dashboard")}</Link>
          </div>
        )}

        {databaseReady && (
          <Link href="/forgot-pin" className="pub-btn pub-btn-ghost pub-btn-block mt-3"><PubIcon name="message" /> {t("Forgot PIN? Get a code by SMS")}</Link>
        )}
        <p className="pub-auth-foot">{t("New to RentFlow?")} <Link href="/register" className="pub-link">{t("Create an account")}</Link></p>
      </div>
    </AuthLayout>
  );
}
