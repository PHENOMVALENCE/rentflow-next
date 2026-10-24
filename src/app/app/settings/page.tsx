import Link from "next/link";
import { AppIcon, type AppIconName } from "@/components/icons";
import { PageHeader, Panel, Status } from "@/components/ui";
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

      <section aria-labelledby="runtime-readiness">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="runtime-readiness" className="font-semibold text-[var(--foreground)]">Runtime readiness</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Configuration is read from the deployment environment and never exposed as editable secrets.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ConfigCard icon="building" title="PostgreSQL" ready={databaseReady} detail={databaseReady ? "DATABASE_URL configured" : "Persistence not connected"} />
          <ConfigCard icon="lock" title="Authentication" ready={authReady} detail={authReady ? "AUTH_SECRET configured" : "Production session secret missing"} />
          <ConfigCard icon="wallet" title="Snippe" ready={snippeReady} detail={snippeReady ? "Payment runtime configured" : "Payment credentials incomplete"} />
          <ConfigCard icon="clock" title="Lease scheduler" ready={cronReady} detail={cronReady ? "CRON_SECRET configured" : "Scheduled lifecycle secret missing"} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {session.role === "PLATFORM_ADMIN" && (
          <Link href="/app/settings/geography" className="group rf-panel p-5 transition hover:border-[var(--border-strong)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
            <div className="flex gap-4">
              <span className="rf-icon-tile shrink-0" aria-hidden="true"><AppIcon name="map" /></span>
              <div className="min-w-0">
                <p className="rf-eyebrow">Reference data</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Tanzania geography</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Import and inspect region, district, ward, street and village reference data with row-level import evidence.</p>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">Open geography administration <AppIcon name="chevron-right" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
              </div>
            </div>
          </Link>
        )}

        <Panel title="Runtime-only secrets" subtitle="Security boundary">
          <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[#f8fafc] p-4">
            <span className="rf-icon-tile shrink-0" aria-hidden="true"><AppIcon name="shield" /></span>
            <p className="text-sm leading-6 text-[var(--muted-strong)]">Database credentials, session secrets, payment credentials and webhook secrets are not editable from the browser. Configure them through the deployment environment.</p>
          </div>
        </Panel>
      </div>
    </>
  );
}

function ConfigCard({ icon, title, ready, detail }: { icon: AppIconName; title: string; ready: boolean; detail: string }) {
  return (
    <article className="rf-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="rf-icon-tile" aria-hidden="true"><AppIcon name={icon} /></span>
        <Status tone={ready ? "success" : "warning"}>{ready ? "Ready" : "Pending"}</Status>
      </div>
      <h3 className="mt-4 font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </article>
  );
}
