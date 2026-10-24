import Link from "next/link";
import { Empty, PageHeader } from "@/components/ui";
import type { SessionPayload } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";

/**
 * Shown instead of a 404 on organization-scoped pages when the session has no organization.
 * Platform admins reach these pages by entering an organization context first.
 */
export function NeedsOrganization({ session, title }: { session: SessionPayload; title: string }) {
  const platform = session.role === "PLATFORM_ADMIN";
  return (
    <>
      <PageHeader title={title} />
      <Empty icon="briefcase" title={platform ? "Choose an organization first" : "This account is not in an organization"} action={platform ? <Link href="/app/platform/organizations" className="rf-btn-primary">Open organizations</Link> : undefined}>
        {!hasDatabaseConfiguration()
          ? "Demo mode has no organization, so organization records are not shown."
          : platform
            ? "This page shows one organization's records. Enter an organization from Platform → Organizations to manage it."
            : "Ask an organization administrator to add you before managing organization records."}
      </Empty>
    </>
  );
}
