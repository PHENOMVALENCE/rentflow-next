import Link from "next/link";
import { PubIcon } from "@/components/icons";
import { AuthAlert, AuthField, AuthLayout, CodeInput } from "@/components/pub/auth";
import { loginAction } from "@/server/auth/actions";
import { hasDatabaseConfiguration } from "@/server/db";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string }> }) {
  const query = await searchParams;
  const databaseReady = hasDatabaseConfiguration();

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>Sign in</h1>
        <p className="pub-auth-intro">Enter your phone number and PIN.</p>

        <div className="mt-5 grid gap-3 empty:hidden">
          {query.reset === "1" && <AuthAlert tone="success">Your account PIN was reset. Sign in with the new PIN.</AuthAlert>}
          {query.error === "invalid" && <AuthAlert tone="error">Invalid phone number or PIN.</AuthAlert>}
          {query.error === "locked" && <AuthAlert tone="error">Too many unsuccessful PIN attempts. Reset your PIN by SMS, or try again after the security window.</AuthAlert>}
          {!databaseReady && <AuthAlert>Database sign-in is not configured yet. The preview dashboard is available in demo mode.</AuthAlert>}
        </div>

        {databaseReady ? (
          <form action={loginAction} className="pub-auth-form">
            <AuthField id="phone" label="Phone number">
              <div className="pub-input-group">
                <PubIcon name="phone" />
                <input id="phone" type="tel" inputMode="tel" name="phone" className="pub-input" placeholder="0712 000 000" autoComplete="tel" required />
              </div>
            </AuthField>
            <AuthField id="pin" label="PIN">
              <CodeInput id="pin" name="pin" />
            </AuthField>
            <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">Sign in</button>
          </form>
        ) : (
          <div className="pub-auth-form">
            <Link href="/app" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">Open preview dashboard</Link>
          </div>
        )}

        {databaseReady && (
          <Link href="/forgot-pin" className="pub-btn pub-btn-ghost pub-btn-block mt-3"><PubIcon name="message" /> Forgot PIN? Get a code by SMS</Link>
        )}
        <p className="pub-auth-foot">New to RentFlow? <Link href="/register" className="pub-link">Create an account</Link></p>
      </div>
    </AuthLayout>
  );
}
