import Link from "next/link";
import { notFound } from "next/navigation";
import { AppIcon } from "@/components/icons";
import { AuditList, Facts, PageHeader, Panel } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getUserDetail } from "@/server/rentflow/platform-detail-read-model";

export const metadata = { title: "User" };

export default async function PlatformUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(["PLATFORM_ADMIN"]);
  const user = await getUserDetail((await params).id);
  if (!user) notFound();

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/app/platform/users" className="rf-link">← Users & access</Link></p>
      <PageHeader eyebrow="Platform · User" title={user.name} description="Account identity, organization access and actions this user performed. Phone numbers are masked; PINs are never shown." />
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Panel title="Account">
            <Facts items={[["Role", user.role], ["Email", user.email], ["Phone", user.phone], ["Last sign-in", user.lastLogin], ["Created", user.created], ["Active supervisor assignments", user.assignments]]} />
          </Panel>
          <Panel title="Actions by this user" subtitle="Latest audit events" flush>
            <AuditList rows={user.audit} />
          </Panel>
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <Panel title="Organizations" flush>
            {user.organizations.length === 0 ? (
              <p className="rf-panel-empty px-4 pb-3 sm:px-5"><AppIcon name="info" className="h-4 w-4" /> Not a member of any organization.</p>
            ) : (
              <ul className="rf-list">
                {user.organizations.map((organization) => (
                  <li key={organization.id}>
                    <Link href={`/app/platform/organizations/${organization.id}`} className="rf-list-row">
                      <span className="rf-list-main"><span className="rf-list-title block">{organization.name}</span><span className="rf-list-meta block">{organization.role}</span></span>
                      <AppIcon name="chevron-right" className="rf-chevron" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
