import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";
import { changeAccountPinAction } from "@/server/auth/account-actions";
import { getSessionUser, requireSession } from "@/server/auth/session";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; changed?: string }> }) {
  await requireSession();
  const user = await getSessionUser();
  const query = await searchParams;

  return (
    <>
      <PageHeader eyebrow="Account" title="Security & profile" description="Manage your RentFlow sign-in PIN and review the identity attached to this session." />

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="rf-card p-6">
          <p className="text-xs text-[var(--muted)]">Signed in as</p>
          <h2 className="mt-2 text-xl font-semibold">{user?.name ?? "Preview user"}</h2>
          <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Phone</dt><dd>{user?.phone ?? "Preview mode"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Email</dt><dd>{user?.email ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Role</dt><dd>{user?.role.replaceAll("_", " ") ?? "PLATFORM ADMIN"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Language</dt><dd>{user?.preferredLanguage === "en" ? "English" : "Kiswahili"}</dd></div>
          </dl>
        </section>

        <section className="rf-card p-6">
          <h2 className="font-semibold">Change account PIN</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Your account PIN is exactly four digits. RentFlow stores only a salted credential hash, never the PIN itself.</p>

          {query.changed === "1" && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Your PIN was changed successfully.</div>}
          {query.error === "invalid" && <ErrorMessage>Enter matching 4-digit PIN values.</ErrorMessage>}
          {query.error === "same" && <ErrorMessage>Choose a new PIN that is different from the current PIN.</ErrorMessage>}
          {query.error === "current" && <ErrorMessage>The current PIN was not accepted.</ErrorMessage>}

          {user ? (
            <form action={changeAccountPinAction} className="mt-6 space-y-5">
              <PinField name="currentPin" label="Current PIN" autoComplete="current-password" />
              <PinField name="newPin" label="New PIN" autoComplete="new-password" />
              <PinField name="confirmPin" label="Confirm new PIN" autoComplete="new-password" />
              <button type="submit" className="rf-button rf-button-dark">Change PIN</button>
            </form>
          ) : (
            <p className="mt-5 text-sm text-[var(--muted)]">Account changes are disabled in preview mode.</p>
          )}
        </section>
      </div>
    </>
  );
}

function PinField({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  return <label className="block text-sm font-medium">{label}<input required type="password" name={name} inputMode="numeric" autoComplete={autoComplete} pattern="[0-9]{4}" minLength={4} maxLength={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 tracking-[0.45em]" /></label>;
}

function ErrorMessage({ children }: { children: ReactNode }) {
  return <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{children}</div>;
}
