import Link from "next/link";
import { Avatar } from "@/components/app-shell";
import { AppIcon } from "@/components/icons";
import { Empty, Metric, Panel, Status } from "@/components/ui";
import type { PendingHome, RoleHome, SupervisorHome, TenantHome } from "@/server/rentflow/home-read-model";
import { getTranslator } from "@/i18n/server";
import { plural } from "@/i18n/translate";

const urgencyClass = { calm: "calm", soon: "caution", urgent: "severe", over: "critical" } as const;

function EmptyLine({ children, icon = "check" }: { children: React.ReactNode; icon?: "check" | "info" }) {
  return <p className="rf-panel-empty"><AppIcon name={icon} className="h-4 w-4" /> {children}</p>;
}

/** Home for tenant and supervisor accounts not yet attached (Laravel `home-pending`). */
async function PendingView({ home }: { home: PendingHome }) {
  const { t } = await getTranslator();
  const tenant = home.role === "TENANT";
  return (
    <div className="mx-auto max-w-[1200px]">
      <p className="rf-eyebrow"><AppIcon name="lock" className="h-3.5 w-3.5" /> {t("Private account")}</p>
      <h1 className="rf-dash-title">{tenant && !home.canRequestAttachment ? t("Waiting for the term") : t("Your account is isolated")}</h1>
      <p className="rf-dash-lede">
        {tenant && !home.canRequestAttachment
          ? t("You are attached. Your landlord will place you on a unit. There is nothing to pay yet.")
          : t("This login is not in an organization yet. It cannot see another landlord’s properties, tenants, or payments.")}
      </p>
      <article className="rf-panel mt-6 p-5 sm:p-6">
        <h2 className="rf-panel-title">{t("What happens next")}</h2>
        <p className="mt-2 text-sm text-[#51607a]">
          {tenant
            ? home.canRequestAttachment
              ? t("Ask your landlord for their RentFlow join link, or request attachment to their workspace. They review the request before anything is shared.")
              : t("Your landlord records your 3- or 6-month lease. It appears here with the exact full-term amount when it is ready.")
            : t("If you supervise places, ask the organization admin to add your phone number on Supervisors. Missing assignment is not access to everything.")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {tenant && home.canRequestAttachment && <Link href="/app/attachment-requests" className="rf-btn-primary">{t("Request attachment")}</Link>}
          <Link href="/" className={tenant && home.canRequestAttachment ? "rf-btn-secondary" : "rf-btn-primary"}>{t("View public listings")}</Link>
        </div>
      </article>
    </div>
  );
}

/** Tenant home (Laravel `home-tenant`): unit, countdown, next step, maintenance, supervisor, notices. */
async function TenantView({ home }: { home: TenantHome }) {
  const { t } = await getTranslator();
  const { lease, countdown, rail, next } = home;
  const urgency = urgencyClass[countdown.urgency];
  const statusTone = lease.rawStatus === "GRACE" || lease.rawStatus === "EXPIRED" ? "error" : lease.rawStatus === "RENEWAL_WINDOW" || lease.rawStatus === "AWAITING_PAYMENT" ? "warning" : "success";
  return (
    <div className="rf-dash">
      <header className="rf-dash-head">
        <div className="min-w-0">
          <h1 className="rf-dash-title">{t("Welcome back,")} {home.firstName}</h1>
          <p className="rf-dash-lede">{t(next.title)}.</p>
        </div>
      </header>

      <article className={`rf-home-card rf-home-card-${urgency}`} data-urgency={urgency} aria-labelledby="home-hero-title">
        <div className="rf-home-copy">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 id="home-hero-title" className="rf-home-title">{t(":property · unit :unit", { property: lease.property, unit: lease.unit })}</h2>
              {lease.address && (
                <p className="mt-1.5 flex items-start gap-1.5 text-sm text-[#51607a]">
                  <span className="mt-0.5" aria-hidden="true"><AppIcon name="pin" className="h-4 w-4" /></span>
                  <span>{lease.address}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2"><Status tone={statusTone}>{t(lease.status)}</Status></div>
          </div>

          <div className={`rf-countdown rf-countdown-home rf-countdown-${urgency} mt-5`} data-urgency={urgency}>
            <div className="rf-countdown-head">
              <div className="min-w-0">
                {countdown.days > 0 ? (
                  <div aria-live="polite" aria-atomic="true">
                    <p className="rf-countdown-number">{countdown.days}</p>
                    <p className="rf-countdown-unit">{countdown.days === 1 ? t("day left") : t("days left")}</p>
                  </div>
                ) : (
                  <p className="rf-countdown-wording" aria-live="polite">{t(countdown.label, countdown.labelParams)}</p>
                )}
                <p className="rf-countdown-date">{t("Lease ends :date", { date: lease.end })}</p>
              </div>
            </div>
            <div className="rf-lease-rail-meter mt-6" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rail.progress} aria-label={t("Lease term progress :percent percent", { percent: rail.progress })}>
              <span className={urgency === "calm" ? "rf-lease-rail-fill" : `rf-lease-rail-fill-${urgency}`} style={{ width: `${rail.progress}%` }} />
            </div>
            <ol className="rf-lease-rail">
              {rail.stops.map((stop) => (
                <li key={stop.label} className={`rf-lease-rail-stop is-${stop.state}`}>
                  <span className="rf-lease-rail-dot" aria-hidden="true" />
                  <span className="rf-lease-rail-label">{t(stop.label)}</span>
                  <span className="rf-lease-rail-when">{stop.date}</span>
                </li>
              ))}
            </ol>
          </div>

          <dl className="rf-home-facts">
            <div className="rf-home-fact"><dt>{t("Term")}</dt><dd>{plural(t, lease.termMonths, "1 month", ":count months")}</dd></div>
            <div className="rf-home-fact"><dt>{t("Start")}</dt><dd>{lease.start}</dd></div>
            <div className="rf-home-fact"><dt>{t("Exact full-term amount")}</dt><dd className="tabular-nums">{lease.amount}</dd></div>
            <div className="rf-home-fact"><dt>{t("Payment")}</dt><dd>{t(lease.payment)}</dd></div>
          </dl>
        </div>
      </article>

      <article className={`rf-next${next.tone === "warning" ? " rf-next-warning" : next.tone === "resolved" ? " rf-next-resolved" : ""}`}>
        <div className="min-w-0">
          <p className="rf-next-label">{t(next.label)}</p>
          <p className="rf-next-title">{t(next.title)}</p>
          <p className="mt-1 max-w-2xl text-sm text-[#51607a]">{t(next.body, next.bodyParams)}</p>
        </div>
        <Link href={next.href} className={`shrink-0 ${next.tone === "resolved" ? "rf-btn-secondary" : "rf-btn-primary"}`}>
          {t(next.action)} <AppIcon name="arrow-right" className="h-4 w-4" />
        </Link>
      </article>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Panel title={t("Maintenance")} subtitle={t("Requests for your unit")} href="/app/maintenance" flush>
            {home.maintenance.length === 0 ? (
              <div className="px-4 pb-4 sm:px-5">
                <EmptyLine>{t("No open maintenance requests")}</EmptyLine>
                <p className="mt-1 text-sm text-[#51607a]">{t("Everything reported for your home has been resolved.")}</p>
                <Link href="/app/maintenance/create" className="rf-btn-secondary mt-4">{t("Report an issue")}</Link>
              </div>
            ) : (
              <ul className="rf-list">
                {home.maintenance.map((item) => (
                  <li key={item.id}>
                    <Link href={`/app/maintenance/${item.id}`} className="rf-list-row">
                      <span className="rf-list-icon" aria-hidden="true"><AppIcon name="wrench" className="h-[18px] w-[18px]" /></span>
                      <span className="rf-list-main">
                        <span className="rf-list-title block">{item.title}</span>
                        <span className="rf-list-meta block">{item.reported}</span>
                      </span>
                      <Status>{t(item.status)}</Status>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="order-first flex min-w-0 flex-col gap-6 lg:order-none" aria-label={t("Contact and notices")}>
          <Panel title={t("Supervisor")} subtitle={t("Your contact for this building")}>
            {home.supervisor ? (
              <>
                <div className="rf-contact">
                  <Avatar name={home.supervisor.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#0b1b33]">{home.supervisor.name}</p>
                    <p className="text-xs text-[#51607a]">{t("Supervisor")}</p>
                  </div>
                </div>
                {home.supervisor.phone && (
                  <a href={`tel:${home.supervisor.phone.replace(/\s+/g, "")}`} className="rf-btn-secondary mt-4 w-full justify-start">
                    <AppIcon name="phone" className="h-4 w-4 text-primary-600" /> <span className="truncate">{home.supervisor.phone}</span>
                  </a>
                )}
              </>
            ) : (
              <EmptyLine icon="info">{t("No supervisor assigned yet. Ask your property administrator.")}</EmptyLine>
            )}
          </Panel>

          <Panel title={t("Notices")} href="/app/notices" flush>
            {home.notices.length === 0 ? (
              <div className="px-4 pb-3 sm:px-5"><EmptyLine>{t("No notices yet.")}</EmptyLine></div>
            ) : (
              <ul className="rf-list">
                {home.notices.map((notice) => (
                  <li key={notice.id}>
                    <Link href={`/app/notices/${notice.id}`} className="rf-list-row items-start">
                      <span className="rf-list-main">
                        <span className="rf-list-title block whitespace-normal">{notice.title}</span>
                        <span className="mt-0.5 block text-xs text-[#51607a]">{notice.published}</span>
                      </span>
                      {notice.severity !== "INFO" && <Status tone="warning">{notice.severity.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</Status>}
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

/** Supervisor home (Laravel `home-supervisor`): assigned places, maintenance queue, renewals. No portfolio finance. */
async function SupervisorView({ home }: { home: SupervisorHome }) {
  const { t } = await getTranslator();
  const units = home.properties.reduce((sum, property) => sum + property.units, 0);
  const occupied = home.properties.reduce((sum, property) => sum + property.occupied, 0);
  const open = home.properties.reduce((sum, property) => sum + property.openMaintenance, 0);
  return (
    <div className="rf-dash">
      <header className="rf-dash-head">
        <div className="min-w-0">
          <h1 className="rf-dash-title">{t("Welcome back,")} {home.firstName}</h1>
          <p className="rf-dash-lede">{plural(t, home.properties.length, "1 place assigned to you.", ":count places assigned to you.")} {t("Only these places are visible to this login.")}</p>
        </div>
        <div className="rf-dash-actions">
          <Link href="/app/maintenance" className="rf-btn-primary"><AppIcon name="wrench" className="h-4 w-4" /> {t("Maintenance queue")}</Link>
        </div>
      </header>

      <section aria-labelledby="supervisor-glance">
        <h2 id="supervisor-glance" className="sr-only">{t("Assigned places at a glance")}</h2>
        <div className="rf-metrics">
          <Metric label={t("Assigned places")} value={home.properties.length} icon="building" href="/app/properties" />
          <Metric label={t("Units")} value={units} icon="home" hint={t(":count occupied", { count: occupied })} />
          <Metric label={t("Open maintenance")} value={open} icon="wrench" href="/app/maintenance" />
          <Metric label={t("Renewals to watch")} value={home.renewals.length} icon="calendar" hint={t("Renewal window and grace")} href="/app/tenants" />
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Panel title={t("Your places")} subtitle={t("Buildings assigned to you")} href="/app/properties" flush>
            {home.properties.length === 0 ? (
              <div className="px-4 pb-3 sm:px-5"><Empty icon="building" title={t("No places assigned yet.")} /></div>
            ) : (
              <ul className="rf-list">
                {home.properties.map((property) => (
                  <li key={property.id}>
                    <Link href={`/app/properties/${property.id}`} className="rf-list-row">
                      <span className="rf-list-icon" aria-hidden="true"><AppIcon name="building" className="h-[18px] w-[18px]" /></span>
                      <span className="rf-list-main">
                        <span className="rf-list-title block">{property.name}</span>
                        <span className="rf-list-meta block">{property.location} · {t(":occupied of :total units occupied", { occupied: property.occupied, total: property.units })}</span>
                      </span>
                      <span className="rf-list-aside">
                        {property.openMaintenance > 0 ? <Status tone="warning">{t(":count open", { count: property.openMaintenance })}</Status> : <Status tone="teal">{t("All clear")}</Status>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={t("Maintenance queue")} subtitle={t("Newest open requests in your places")} href="/app/maintenance" flush>
            {home.maintenance.length === 0 ? (
              <div className="px-4 pb-3 sm:px-5"><EmptyLine>{t("No open maintenance in your places.")}</EmptyLine></div>
            ) : (
              <ul className="rf-list">
                {home.maintenance.map((item) => (
                  <li key={item.id}>
                    <Link href={`/app/maintenance/${item.id}`} className="rf-list-row">
                      <span className="rf-list-icon" aria-hidden="true"><AppIcon name="wrench" className="h-[18px] w-[18px]" /></span>
                      <span className="rf-list-main">
                        <span className="rf-list-title block">{item.title}</span>
                        <span className="rf-list-meta block">{item.property} · {t(":priority priority", { priority: t(item.priority) })}</span>
                      </span>
                      <span className="rf-list-aside"><Status>{t(item.status)}</Status></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-6" aria-label={t("Renewals")}>
          <Panel title={t("Renewals to watch")} subtitle={t("Tenants in renewal window or grace")} flush>
            {home.renewals.length === 0 ? (
              <div className="px-4 pb-3 sm:px-5"><EmptyLine>{t("No renewal-window or grace leases in your places.")}</EmptyLine></div>
            ) : (
              <ul className="rf-list">
                {home.renewals.map((lease) => (
                  <li key={lease.id} className="rf-list-row">
                    <Avatar name={lease.tenant} size="md" />
                    <span className="rf-list-main">
                      <span className="rf-list-title block">{lease.tenant}</span>
                      <span className="rf-list-meta block">{lease.unit}</span>
                    </span>
                    <span className="rf-list-aside">
                      <Status>{t(lease.status)}</Status>
                      <span className="text-xs text-[#51607a]">{t("Ends :date", { date: lease.end })}</span>
                    </span>
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

export function RoleHomeView({ home }: { home: RoleHome }) {
  if (home.kind === "pending") return <PendingView home={home} />;
  if (home.kind === "tenant") return <TenantView home={home} />;
  return <SupervisorView home={home} />;
}
