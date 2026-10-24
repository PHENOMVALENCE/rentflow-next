import type { ReactNode } from "react";
import { AppIcon } from "@/components/icons";
import { Facts, PageHeader, Panel, Status } from "@/components/ui";
import { changeAccountPinAction } from "@/server/auth/account-actions";
import { getSessionUser, requireSession } from "@/server/auth/session";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; changed?: string }> }) {
  await requireSession();
  const user = await getSessionUser();
  const query = await searchParams;

  return (
    <>
      <PageHeader eyebrow="Account" title="Security & profile" description="Manage your RentFlow sign-in PIN and review the identity attached to this session." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <Panel title="Account identity" subtitle="Identity attached to the current authenticated session">
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[#f8fafc] p-4">
            <span className="rf-icon-tile shrink-0" aria-hidden="true"><AppIcon name="user" /></span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--foreground)]">{user?.name ?? "Preview user"}</p>
              <div className="mt-1"><Status tone="info">{user?.role.replaceAll("_", " ") ?? "PLATFORM ADMIN"}</Status></div>
            </div>
          </div>
          <Facts items={[
            ["Phone", user?.phone ?? "Preview mode"],
            ["Email", user?.email ?? "—"],
            ["Role", user?.role.replaceAll("_", " ") ?? "PLATFORM ADMIN"],
            ["Language", user?.preferredLanguage === "en" ? "English" : "Kiswahili"],
          ]} />
        </Panel>

        <Panel title="Change account PIN" subtitle="Four digits, stored only as a salted credential hash">
          {query.changed === "1" && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Your PIN was changed successfully.</div>}
          {query.error === "invalid" && <ErrorMessage>Enter matching 4-digit PIN values.</ErrorMessage>}
          {query.error === "same" && <ErrorMessage>Choose a new PIN that is different from the current PIN.</ErrorMessage>}
          {query.error === "current" && <ErrorMessage>The current PIN was not accepted.</ErrorMessage>}

          {user ? (
            <form action={changeAccountPinAction} className="space-y-5">
              <PinField name="currentPin" label="Current PIN" autoComplete="current-password" />
              <PinField name="newPin" label="New PIN" autoComplete="new-password" />
              <PinField name="confirmPin" label="Confirm new PIN" autoComplete="new-password" />
              <button type="submit" className="rf-button rf-button-dark"><AppIcon name="lock" className="h-4 w-4" /> Change PIN</button>
            </form>
          ) : (
            <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[#f8fafc] p-4">
              <span className="rf-icon-tile shrink-0" aria-hidden="true"><AppIcon name="info" /></span>
              <p className="text-sm leading-6 text-[var(--muted)]">Account changes are disabled in preview mode.</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function PinField({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  return (
    <label className="rf-field">
      {label}
      <input required type="password" name={name} inputMode="numeric" autoComplete={autoComplete} pattern="[0-9]{4}" minLength={4} maxLength={4} className="tracking-[0.45em]" />
    </label>
  );
}

function ErrorMessage({ children }: { children: ReactNode }) {
  return <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{children}</div>;
}
