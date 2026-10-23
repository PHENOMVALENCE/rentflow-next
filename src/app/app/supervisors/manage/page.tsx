import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { SupervisorInviteForm } from "@/components/supervisor-invite-form";
import { resetManagedAccountPinAction } from "@/server/auth/operator-pin-actions";
import { requireSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { assignSupervisor, unassignSupervisor } from "@/server/rentflow/supervisor-actions";

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function SupervisorManagementPage({ searchParams }: { searchParams: Promise<{ pinReset?: string; error?: string }> }) {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const query = await searchParams;

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Supervisors" title="Supervisor management" description="Invitations and assignments require the production database." action={<Link href="/app/supervisors" className="rf-button rf-button-light">Back</Link>} />
        <div className="rf-card max-w-2xl p-6 text-sm text-[var(--muted-strong)]">Connect PostgreSQL before creating supervisor accounts or assignments.</div>
      </>
    );
  }

  if (!session.organizationId) throw new Error("An organization is required to manage supervisors.");

  const [members, properties, assignments, invites] = await Promise.all([
    db.organizationMember.findMany({
      where: { organizationId: session.organizationId, role: "SUPERVISOR" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    db.property.findMany({ where: { organizationId: session.organizationId, active: true }, orderBy: { name: "asc" } }),
    db.supervisorAssignment.findMany({
      where: { property: { organizationId: session.organizationId } },
      include: { user: true, property: true },
      orderBy: { startsAt: "desc" },
    }),
    db.supervisorInvite.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Supervisors" title="Supervisor management" description="Invite supervisors and explicitly assign their property access." action={<Link href="/app/supervisors" className="rf-button rf-button-light">Back</Link>} />

      {query.pinReset === "1" && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Supervisor PIN invalidated. Their existing session is revoked and they must verify their phone before setting a new PIN.</div>}
      {query.error === "pin_reset_denied" && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">This supervisor account cannot be reset from the current organization context.</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <SupervisorInviteForm properties={properties.map((property) => ({ id: property.id, name: property.name }))} />

        <section className="rf-card p-6">
          <h2 className="font-semibold">Assign property access</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Only accepted supervisor accounts can be assigned.</p>
          <form action={assignSupervisor} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Supervisor<select name="userId" required className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="">Select supervisor</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.user.name} · {member.user.phone ?? member.user.email}</option>)}</select></label>
            <label className="block text-sm font-medium">Property<select name="propertyId" required className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"><option value="">Select property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label>
            <button type="submit" className="rf-button rf-button-dark">Assign supervisor</button>
          </form>
        </section>
      </div>

      <section className="rf-card mt-6 overflow-hidden">
        <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Supervisor accounts</h2><p className="mt-1 text-xs text-[var(--muted)]">Office PIN reset is limited to supervisor accounts in this organization.</p></div>
        {members.length === 0 ? <p className="p-5 text-sm text-[var(--muted-strong)]">No accepted supervisor accounts yet.</p> : members.map((member) => (
          <div key={member.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><p className="font-medium">{member.user.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{member.user.phone ?? member.user.email}</p></div>
            <form action={resetManagedAccountPinAction}>
              <input type="hidden" name="targetUserId" value={member.userId} />
              <input type="hidden" name="returnPath" value="/app/supervisors/manage" />
              <button type="submit" className="rf-button rf-button-light">Reset account PIN</button>
            </form>
          </div>
        ))}
      </section>

      <section className="rf-card mt-6 overflow-hidden">
        <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Property assignments</h2><p className="mt-1 text-xs text-[var(--muted)]">Assignment state is authoritative for supervisor access.</p></div>
        {assignments.length === 0 ? <p className="p-5 text-sm text-[var(--muted-strong)]">No supervisor assignments yet.</p> : assignments.map((assignment) => (
          <div key={assignment.id} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
            <div><p className="font-medium">{assignment.user.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{assignment.user.phone ?? assignment.user.email}</p></div>
            <div><p className="font-medium">{assignment.property.name}</p><p className="mt-1 text-xs text-[var(--muted)]">Since {date.format(assignment.startsAt)}</p></div>
            <Status>{assignment.active ? "Active" : "Inactive"}</Status>
            {assignment.active && <form action={unassignSupervisor}><input type="hidden" name="assignmentId" value={assignment.id} /><button className="rf-button rf-button-light" type="submit">Unassign</button></form>}
          </div>
        ))}
      </section>

      <section className="rf-card mt-6 overflow-hidden">
        <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Recent invitations</h2></div>
        {invites.length === 0 ? <p className="p-5 text-sm text-[var(--muted-strong)]">No invitations created.</p> : invites.map((invite) => (
          <div key={invite.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-medium">{invite.email}</p><p className="mt-1 text-xs text-[var(--muted)]">Expires {date.format(invite.expiresAt)}</p></div><Status>{invite.acceptedAt ? "Accepted" : invite.expiresAt <= new Date() ? "Expired" : "Pending"}</Status></div>
        ))}
      </section>
    </>
  );
}
