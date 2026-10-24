import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";

export default async function SettingsPage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD"]);
  const databaseReady = hasDatabaseConfiguration();
  const snippeReady = Boolean(process.env.SNIPPE_API_KEY && process.env.SNIPPE_WEBHOOK_SECRET && process.env.SNIPPE_WEBHOOK_URL);
  const cronReady = Boolean(process.env.CRON_SECRET);
  const authReady = Boolean(process.env.AUTH_SECRET);

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Runtime, platform reference data and provider configuration status. Secrets remain server-side."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ConfigCard title="PostgreSQL" ready={databaseReady} detail={databaseReady ? "DATABASE_URL configured" : "Persistence not connected"} />
        <ConfigCard title="Authentication" ready={authReady} detail={authReady ? "AUTH_SECRET configured" : "Production session secret missing"} />
        <ConfigCard title="Snippe" ready={snippeReady} detail={snippeReady ? "Payment runtime configured" : "Payment credentials incomplete"} />
        <ConfigCard title="Lease scheduler" ready={cronReady} detail={cronReady ? "CRON_SECRET configured" : "Scheduled lifecycle secret missing"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {session.role === "PLATFORM_ADMIN" && (
          <Link href="/app/settings/geography" className="rf-card p-6 hover:bg-slate-50">
            <p className="rf-eyebrow">Reference data</p>
            <h2 className="mt-2 text-xl font-semibold">Tanzania geography</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Import and inspect region, district, ward, street and village reference data with row-level import evidence.</p>
            <p className="mt-5 text-sm font-medium">Open geography administration →</p>
          </Link>
        )}

        <div className="rf-card p-6">
          <p className="rf-eyebrow">Security</p>
          <h2 className="mt-2 text-xl font-semibold">Runtime-only secrets</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Database credentials, session secrets, payment credentials and webhook secrets are not editable from the browser. Configure them through the deployment environment.</p>
        </div>
      </div>
    </>
  );
}

function ConfigCard({ title, ready, detail }: { title: string; ready: boolean; detail: string }) {
  return (
    <div className="rf-card p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{title}</h2><Status>{ready ? "Ready" : "Pending"}</Status></div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}
