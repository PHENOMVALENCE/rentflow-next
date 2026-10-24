import Link from "next/link";
import { notFound } from "next/navigation";
import { AppIcon } from "@/components/icons";
import { AuditList, Facts, Metric, PageHeader, Panel, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { enterOrganizationContext } from "@/server/rentflow/platform-context-actions";
import { getOrganizationDetail } from "@/server/rentflow/platform-detail-read-model";

export const metadata = { title: "Organization" };

export default async function PlatformOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(["PLATFORM_ADMIN"]);
  const organization = await getOrganizationDetail((await params).id);
  if (!organization) notFound();

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/app/platform/organizations" className="rf-link">← Organizations</Link></p>
      <PageHeader
        eyebrow="Platform · Organization"
        title={organization.name}
        description="Workspace footprint and recent activity. Enter the organization to work inside its records; the switch is audited."
        action={
          hasDatabaseConfiguration() ? (
            <form action={enterOrganizationContext}>
              <input type="hidden" name="organizationId" value={organization.id} />
              <button type="submit" className="rf-btn-primary"><AppIcon name="arrow-right" className="h-4 w-4" /> Enter organization</button>
            </form>
          ) : (
            <span className="rf-status rf-status-warning">Entering needs the database</span>
          )
        }
      />
      <div className="rf-dash">
        <div className="rf-metrics">
          <Metric label="Properties" value={organization.counts.properties} icon="building" />
          <Metric label="Units" value={organization.counts.units} icon="home" />
          <Metric label="Tenants" value={organization.counts.tenants} icon="users" />
          <Metric label="Active leases" value={organization.counts.activeLeases} icon="calendar" />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
            <Panel title="Recent activity" subtitle="Latest audit events in this organization" flush>
              <AuditList rows={organization.audit} />
            </Panel>
          </div>
          <aside className="flex min-w-0 flex-col gap-6">
            <Panel title="Details">
              <Facts items={[["Status", <Status key="s" tone={organization.active ? "teal" : "neutral"}>{organization.active ? "Active" : "Inactive"}</Status>], ["Slug", <span key="slug" className="rf-mono">{organization.slug}</span>], ["Created", organization.created], ["Members", organization.counts.members]]} />
            </Panel>
            <Panel title="Members" flush>
              {organization.members.length === 0 ? (
                <p className="rf-panel-empty px-4 pb-3 sm:px-5"><AppIcon name="info" className="h-4 w-4" /> No members yet.</p>
              ) : (
                <ul className="rf-list">
                  {organization.members.map((member) => (
                    <li key={member.id}>
                      <Link href={`/app/platform/users/${member.id}`} className="rf-list-row">
                        <span className="rf-list-main"><span className="rf-list-title block">{member.name}</span><span className="rf-list-meta block">{member.role}</span></span>
                        <AppIcon name="chevron-right" className="rf-chevron" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}
