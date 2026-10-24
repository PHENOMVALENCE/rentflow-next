import { AppShell } from "@/components/app-shell";
import { logoutAction } from "@/server/auth/actions";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const demoMode = !hasDatabaseConfiguration();

  let userName = "Demo Administrator";
  let workspaceName = "RentFlow Preview";

  if (!demoMode) {
    const [user, organization] = await Promise.all([
      db.user.findUnique({ where: { id: session.userId } }),
      session.organizationId ? db.organization.findUnique({ where: { id: session.organizationId } }) : null,
    ]);
    userName = user?.name ?? "RentFlow User";
    workspaceName = organization?.name ?? "Platform Administration";
  }

  return (
    <AppShell role={session.role} userName={userName} workspaceName={workspaceName} demoMode={demoMode} logout={demoMode ? undefined : logoutAction}>
      {children}
    </AppShell>
  );
}
