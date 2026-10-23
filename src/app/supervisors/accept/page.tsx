import Link from "next/link";
import { acceptSupervisorInvite } from "@/server/auth/supervisor-invite";

export default async function AcceptSupervisorPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  const token = query.token?.trim() ?? "";

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
        <div className="rf-card mt-10 p-6 sm:p-8">
          <p className="rf-eyebrow">Supervisor onboarding</p>
          <h1 className="text-3xl font-semibold">Accept your invitation</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Create your supervisor account. Access will still be limited to properties explicitly assigned to you.</p>

          {(query.error === "invalid" || !token) && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">This invitation is missing, expired, invalid, or already used.</div>
          )}

          {token && query.error !== "invalid" && (
            <form action={acceptSupervisorInvite} className="mt-6 space-y-5">
              <input type="hidden" name="token" value={token} />
              <label className="block text-sm font-medium">Full name<input required name="name" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /></label>
              <label className="block text-sm font-medium">Password<input required name="password" type="password" minLength={12} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3" /><span className="mt-1 block text-xs text-[var(--muted)]">At least 12 characters.</span></label>
              <button type="submit" className="rf-button rf-button-dark w-full">Create supervisor account</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
