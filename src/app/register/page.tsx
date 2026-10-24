import Link from "next/link";
import { PubIcon } from "@/components/icons";
import { AuthAlert, AuthField, AuthLayout, CodeInput } from "@/components/pub/auth";
import { requestRegistrationOtp } from "@/server/auth/registration-actions";

export const metadata = { title: "Create an account" };

const errorMessages: Record<string, string> = {
  invalid: "Check the form details and try again.",
  phone: "Use a valid Tanzanian mobile number.",
  expired: "Your registration session expired. Start again.",
  persistence: "Registration is unavailable until persistent storage is configured.",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; role?: string }> }) {
  const { error, role } = await searchParams;
  // Laravel links landlords with role=ORGANIZATION_ADMIN; Next calls the same account LANDLORD.
  const defaultRole = role === "LANDLORD" || role === "ORGANIZATION_ADMIN" ? "LANDLORD" : "TENANT";

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>Create an account</h1>
        <p className="pub-auth-intro">Everyone has their own login. Landlords open a new organization; tenants connect to their landlord after signing a lease.</p>

        {error && <div className="mt-5"><AuthAlert tone="error">{errorMessages[error] ?? "Registration could not continue."}</AuthAlert></div>}

        <form action={requestRegistrationOtp} className="pub-auth-form">
          <fieldset className="pub-field m-0 border-0 p-0">
            <legend className="pub-label mb-2">I am</legend>
            <div className="grid gap-2">
              <label className="pub-choice"><input type="radio" name="role" value="TENANT" defaultChecked={defaultRole === "TENANT"} /> <span>A tenant renting a space</span></label>
              <label className="pub-choice"><input type="radio" name="role" value="LANDLORD" defaultChecked={defaultRole === "LANDLORD"} /> <span>A landlord or property team</span></label>
            </div>
          </fieldset>
          <div className="rf-landlord-only">
          <AuthField id="organizationName" label="Organization name" hint="This creates a new, empty organization for you; it doesn't give access to any other landlord.">
            <input id="organizationName" name="organizationName" maxLength={255} className="pub-input" aria-describedby="organizationName-hint" />
          </AuthField>
          </div>
          <AuthField id="name" label="Full name">
            <input id="name" name="name" required minLength={2} maxLength={255} autoComplete="name" className="pub-input" />
          </AuthField>
          <AuthField id="phone" label="Phone number" hint="We send a 4-digit code to verify it.">
            <div className="pub-input-group">
              <PubIcon name="phone" />
              <input id="phone" name="phone" type="tel" inputMode="tel" required placeholder="0712 000 000" autoComplete="tel" className="pub-input" aria-describedby="phone-hint" />
            </div>
          </AuthField>
          <AuthField id="email" label="Email" optional>
            <input id="email" name="email" type="email" maxLength={255} autoComplete="email" className="pub-input" />
          </AuthField>
          <div className="pub-form-grid pub-form-grid-2">
            <AuthField id="pin" label="Choose a PIN"><CodeInput id="pin" name="pin" autoComplete="new-password" /></AuthField>
            <AuthField id="pinConfirmation" label="Confirm PIN"><CodeInput id="pinConfirmation" name="pinConfirmation" autoComplete="new-password" /></AuthField>
          </div>
          <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">Send verification code</button>
        </form>

        <p className="pub-auth-foot">Already registered? <Link href="/login" className="pub-link">Sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
