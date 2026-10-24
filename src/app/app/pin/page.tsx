import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { setupAccountPinAction } from "@/server/auth/account-actions";
import { UNSET_PIN_HASH } from "@/server/auth/pin-constants";
import { getSessionUser, requireSession } from "@/server/auth/session";

export default async function PinPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireSession();
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.passwordHash !== UNSET_PIN_HASH) redirect("/app/account");
  const { error } = await searchParams;

  return <>
    <PageHeader eyebrow="Account setup" title="Choose your 4-digit PIN" description="Complete your account setup before continuing tenant onboarding." />
    <section className="rf-card max-w-xl p-6">
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Enter matching 4-digit PIN values.</div>}
      <form action={setupAccountPinAction} className="space-y-5">
        <label className="block text-sm font-medium">New PIN<input required type="password" name="newPin" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /></label>
        <label className="block text-sm font-medium">Confirm PIN<input required type="password" name="confirmPin" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /></label>
        <button className="rf-button rf-button-dark" type="submit">Save PIN and continue</button>
      </form>
    </section>
  </>;
}
