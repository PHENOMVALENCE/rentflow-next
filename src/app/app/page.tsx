import Link from "next/link";
import { redirect } from "next/navigation";
import { AppIcon, type AppIconName } from "@/components/icons";
import { Metric, Panel, Progress, Status } from "@/components/ui";
import { Avatar } from "@/components/app-shell";
import { canManagePortfolio } from "@/server/auth/authorization";
import { requireSession } from "@/server/auth/session";
import { getDashboardReadModel } from "@/server/rentflow/read-model";
import { getRoleHome } from "@/server/rentflow/home-read-model";
import { RoleHomeView } from "@/components/home/role-home";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { getTranslator } from "@/i18n/server";
import { plural, type Translate } from "@/i18n/translate";

type Attention = { count: number; severity: "critical" | "warning" | "info"; icon: AppIconName; label: string; hint: string; href?: string };

function AttentionItem({ item, t }: { item: Attention; t: Translate }) {
  const word = item.severity === "critical" ? t("Urgent") : item.severity === "warning" ? t("Due soon") : t("To review");
  const body = (
    <>
      <span className="rf-attn-icon" aria-hidden="true"><AppIcon name={item.icon} className="h-[18px] w-[18px]" /></span>
      <span className="rf-list-main">
        <span className="rf-attn-label">{item.label}</span>
        <span className="rf-attn-hint"><span className="font-semibold">{word}</span> · {item.hint}</span>
      </span>
      <span className="rf-attn-count" aria-hidden="true">{item.count}</span>
      {item.href && <AppIcon name="chevron-right" className="rf-chevron" />}
    </>
  );
  const className = `rf-attn-row rf-attn-${item.severity}`;
  return <li>{item.href ? <Link href={item.href} className={className} data-severity={item.severity}>{body}</Link> : <div className={className} data-severity={item.severity}>{body}</div>}</li>;
}

function EmptyLine({ children, icon = "check" }: { children: React.ReactNode; icon?: AppIconName }) {
  return <p className="rf-panel-empty"><AppIcon name={icon} className="h-4 w-4" /> {children}</p>;
}

export default async function Dashboard() {
  const session = await requireSession();
  // Tenants and supervisors get their own homes (Laravel home-tenant / home-supervisor / home-pending).
  const roleHome = await getRoleHome(session);
  if (roleHome) return <RoleHomeView home={roleHome} />;
  // Outside an organization context, a platform admin's home is the platform command center (Laravel parity).
  if (session.role === "PLATFORM_ADMIN" && !session.organizationId) redirect("/app/platform");
  const { t } = await getTranslator();

  const { dashboard, leases, maintenance, source } = await getDashboardReadModel(session);
  const portfolioRole = canManagePortfolio(session.role);
  const isSupervisor = session.role === "SUPERVISOR";
  const isTenant = session.role === "TENANT";

  const user = hasDatabaseConfiguration() ? await db.user.findUnique({ where: { id: session.userId }, select: { name: true } }) : null;
  const firstName = (user?.name ?? "Demo Administrator").trim().split(/\s+/)[0];
  const collection = Math.max(0, Math.min(100, Number.parseInt(String(dashboard.collection), 10) || 0));
  const occupancy = dashboard.units > 0 ? Math.round((dashboard.occupied / dashboard.units) * 100) : 0;
  const vacant = Math.max(0, dashboard.units - dashboard.occupied);

  const attention: Attention[] = [
    { count: dashboard.grace, severity: "critical" as const, icon: "clock" as const, label: plural(t, dashboard.grace, "1 lease needs a completed renewal", ":count leases need a completed renewal"), hint: t("Grace period"), href: isSupervisor ? undefined : "/app/leases" },
    { count: isSupervisor ? 0 : dashboard.paymentExceptions, severity: "critical" as const, icon: "alert" as const, label: plural(t, dashboard.paymentExceptions, "1 payment needs review", ":count payments need review"), hint: t("Wrong or partial amount is not paid"), href: portfolioRole ? "/app/payment-exceptions" : undefined },
    { count: dashboard.renewal, severity: "warning" as const, icon: "calendar" as const, label: plural(t, dashboard.renewal, "1 lease in its renewal window", ":count leases in their renewal window"), hint: t("Ends within 14 days"), href: isSupervisor ? undefined : "/app/leases" },
    { count: dashboard.maintenance, severity: "info" as const, icon: "wrench" as const, label: plural(t, dashboard.maintenance, "1 open maintenance request", ":count open maintenance requests"), hint: isTenant ? t("For your unit") : t("In your scope"), href: "/app/maintenance" },
  ].filter((item) => item.count > 0);
  const attentionTotal = attention.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="rf-dash">
      <header className="rf-dash-head">
        <div className="min-w-0">
          <h1 className="rf-dash-title">{t("Welcome back,")} {firstName}</h1>
          <p className="rf-dash-lede">
            {attentionTotal > 0 ? plural(t, attentionTotal, "1 item needs attention today.", ":count items need attention today.") : "Nothing needs attention right now."}{" "}
            {isTenant ? t("Your lease, payment and maintenance activity only.") : isSupervisor ? t("Limited to properties assigned to you.") : t("Lease and occupancy snapshot for your portfolio.")}
          </p>
        </div>
        {portfolioRole && (
          <div className="rf-dash-actions">
            <Link href="/app/properties/create" className="rf-btn-primary"><AppIcon name="plus" className="h-4 w-4" /> {t("Add property")}</Link>
            <Link href="/app/tenants/create" className="rf-btn-secondary"><AppIcon name="users" className="h-4 w-4" /> {t("Add tenant")}</Link>
          </div>
        )}
      </header>

      {source === "demo" && (
        <div className="rf-context-banner mb-0!" role="status">
          <div>
            <p className="caption font-medium uppercase tracking-[0.12em] text-neutral-500">{t("Preview data")}</p>
            <p className="mt-1 text-sm text-neutral-900">{t("DATABASE_URL is not configured, so demo figures are shown. Scoped PostgreSQL data replaces them once persistence is attached.")}</p>
          </div>
        </div>
      )}

      <section aria-labelledby="portfolio-glance">
        <h2 id="portfolio-glance" className="sr-only">{t("Portfolio at a glance")}</h2>
        <div className="rf-metrics">
          <Metric
            label={isTenant ? t("Protected units") : t("Occupancy rate")}
            value={isTenant ? dashboard.occupied : dashboard.units > 0 ? `${occupancy}%` : t("No units")}
            icon="users"
            progress={!isTenant && dashboard.units > 0 ? occupancy : undefined}
            progressTone="teal"
            hint={isTenant ? t("Current lease relationships") : t(":occupied of :total rentable units", { occupied: dashboard.occupied, total: dashboard.units })}
            href={isTenant ? "/app/leases" : "/app/properties"}
          />
          <Metric
            label={isTenant ? t("Properties rented") : t("Vacant units")}
            value={isTenant ? dashboard.properties : vacant}
            icon="building"
            hint={isTenant ? t(":count relevant units", { count: dashboard.units }) : vacant === 0 ? t("Every rentable unit is occupied") : t(":count on public listings", { count: dashboard.listed })}
            href={isTenant ? undefined : "/app/properties"}
          />
          <Metric
            label={isSupervisor ? t("Units in scope") : t("Verified paid")}
            value={isSupervisor ? dashboard.units : dashboard.revenue}
            icon="wallet"
            hint={isSupervisor ? t("Across :count assigned properties", { count: dashboard.properties }) : t(":percent of obligations confirmed", { percent: dashboard.collection })}
            href={isSupervisor ? "/app/tenants" : "/app/receipts"}
          />
          <Metric label={t("Open maintenance")} value={dashboard.maintenance} icon="wrench" hint={isTenant ? t("Requests for your unit") : t("Requests in your scope")} href="/app/maintenance" />
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Panel title={t("Needs attention")} subtitle={attention.length > 0 ? t("Most urgent first") : undefined} flush>
            {attention.length === 0 ? (
              <div className="px-4 pb-3 sm:px-5"><EmptyLine>{t("Nothing needs attention right now.")}</EmptyLine></div>
            ) : (
              <ul className="rf-list">{attention.map((item) => <AttentionItem key={item.label} item={item} t={t} />)}</ul>
            )}
          </Panel>

          <Panel title={t("Active maintenance")} subtitle={t("Newest open requests")} href="/app/maintenance" linkLabel={t("All maintenance")} flush>
            {maintenance.length === 0 ? (
              <div className="px-4 pb-3 sm:px-5"><EmptyLine>{t("No open maintenance in your scope.")}</EmptyLine></div>
            ) : (
              <ul className="rf-list">
                {maintenance.map((item) => (
                  <li key={`${item.title}-${item.property}`}>
                    <Link href="/app/maintenance" className="rf-list-row">
                      <span className="rf-list-icon" aria-hidden="true"><AppIcon name="wrench" className="h-[18px] w-[18px]" /></span>
                      <span className="rf-list-main">
                        <span className="rf-list-title block">{item.title}</span>
                        <span className="rf-list-meta block">{item.property} · {item.tenant} · {t(":priority priority", { priority: t(item.priority) })}</span>
                      </span>
                      <span className="rf-list-aside"><Status>{t(item.status)}</Status></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-6" aria-label={t("Payments and renewals")}>
          {!isSupervisor && (
            <Panel title={isTenant ? t("Payment completion") : t("Payments")} subtitle={t("Full-term obligations confirmed")}>
              <div className="rf-bar-head">
                <span className="rf-bar-label">{t("Confirmed")}</span>
                <span className="rf-bar-value">{collection}%</span>
              </div>
              <Progress value={collection} tone="teal" label={`${t("Confirmed")}: ${collection}%`} />
              <p className="mt-3 text-sm text-[#51607a]">{t(":amount verified paid in scope.", { amount: dashboard.revenue })} {t("Browser success never confirms a payment; only provider reconciliation does.")}</p>
              {portfolioRole && dashboard.paymentExceptions > 0 && (
                <Link href="/app/payment-exceptions" className="rf-btn-secondary mt-4 w-full"><AppIcon name="alert" className="h-4 w-4 text-[#cf1322]" /> {t("Review exceptions")}</Link>
              )}
            </Panel>
          )}

          <Panel title={t("Upcoming renewals")} subtitle={t("Renewal window and grace, soonest first")} flush>
            {leases.length === 0 ? (
              <div className="px-4 pb-3 sm:px-5"><EmptyLine>{t("No renewal-window or grace leases in your scope.")}</EmptyLine></div>
            ) : (
              <ul className="rf-list">
                {leases.map((lease) => (
                  <li key={`${lease.tenant}-${lease.unit}`}>
                    <Link href={isSupervisor ? "/app/tenants" : "/app/leases"} className="rf-list-row">
                      <Avatar name={lease.tenant} size="md" />
                      <span className="rf-list-main">
                        <span className="rf-list-title block">{lease.tenant}</span>
                        <span className="rf-list-meta block">{lease.unit} · {lease.amount}</span>
                      </span>
                      <span className="rf-list-aside">
                        <Status>{t(lease.status)}</Status>
                        <span className="text-xs text-[#51607a]">{t("Ends :date", { date: lease.end })}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
