import Link from "next/link";
import { loginAction } from "@/server/auth/actions";
import { hasDatabaseConfiguration } from "@/server/db";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const databaseReady = hasDatabaseConfiguration();

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
        <div className="rf-card mt-10 p-6 sm:p-8">
          <p className="rf-eyebrow">Secure access</p>
          <h1 className="text-3xl font-semibold">Sign in to RentFlow</h1>
          <p className="mt-2 text-sm text-[var(--muted-strong)]">Use your organization account to access property operations.</p>

          {query.error === "invalid" && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Invalid email or password.</div>}
          {!databaseReady && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Database authentication is not configured yet. The preview dashboard remains available in demo mode.</div>}

          <form action={loginAction} className="mt-6 space-y-5">
            <label className="block text-sm font-medium">Email<input required type="email" name="email" disabled={!databaseReady} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 disabled:bg-slate-50" /></label>
            <label className="block text-sm font-medium">Password<input required type="password" name="password" minLength={8} disabled={!databaseReady} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 disabled:bg-slate-50" /></label>
            {databaseReady ? <button type="submit" className="rf-button rf-button-dark w-full">Sign in</button> : <Link href="/app" className="rf-button rf-button-dark w-full">Open preview dashboard</Link>}
          </form>
        </div>
      </div>
    </main>
  );
}
