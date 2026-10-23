import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { getCommunityDetail } from "@/server/rentflow/community-read-model";
import { hideCommunityMessage, joinCommunity, postCommunityMessage, reportCommunityMessage } from "@/server/rentflow/community-actions";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Community" title="Community workspace" description="Community messaging requires the production database." />
        <div className="rf-card max-w-2xl p-6"><Link href="/app/notices" className="rf-button rf-button-light">Back to notices & community</Link></div>
      </>
    );
  }

  const community = await getCommunityDetail(id, session);
  if (!community) notFound();
  const canModerate = session.role === "PLATFORM_ADMIN" || session.role === "LANDLORD" || session.role === "PROPERTY_ADMIN" || session.role === "SUPERVISOR";

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title={community.name}
        description={community.propertyId ? "Property-scoped community" : "Organization-wide community"}
        action={<Link href="/app/notices" className="rf-button rf-button-light">Back</Link>}
      />

      {!community.joined ? (
        <section className="rf-card max-w-2xl p-6">
          <h2 className="font-semibold">Join this community</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Membership is required before messages can be read or posted. Eligibility is checked against your organization and active property scope.</p>
          <form action={joinCommunity} className="mt-5"><input type="hidden" name="communityId" value={community.id} /><button type="submit" className="rf-button rf-button-dark">Join community</button></form>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="rf-card overflow-hidden">
            <div className="border-b border-[var(--border)] p-5"><h2 className="font-semibold">Messages</h2><p className="mt-1 text-xs text-[var(--muted)]">Up to the latest 100 visible messages</p></div>
            {community.messages.length === 0 ? <p className="p-6 text-sm text-[var(--muted-strong)]">No messages yet.</p> : community.messages.map((message) => (
              <article key={message.id} className="border-b border-[var(--border)] p-5 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{message.authorName}</p><p className="mt-1 text-xs text-[var(--muted)]">{message.authorRole?.replaceAll("_", " ") ?? "MEMBER"} · {date.format(message.createdAt)}</p></div>{message.reportedByViewer && <Status>Reported</Status>}</div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{message.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!message.reportedByViewer && message.authorId !== session.userId && (
                    <form action={reportCommunityMessage} className="flex gap-2"><input type="hidden" name="messageId" value={message.id} /><input name="reason" required minLength={3} maxLength={500} placeholder="Reason for report" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs" /><button type="submit" className="rf-button rf-button-light">Report</button></form>
                  )}
                  {canModerate && <form action={hideCommunityMessage}><input type="hidden" name="messageId" value={message.id} /><button type="submit" className="rf-button rf-button-light">Hide message</button></form>}
                </div>
              </article>
            ))}
          </section>

          <aside className="rf-card h-fit p-5">
            <h2 className="font-semibold">Post a message</h2>
            <form action={postCommunityMessage} className="mt-4">
              <input type="hidden" name="communityId" value={community.id} />
              <textarea name="body" rows={6} required maxLength={3000} className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm" placeholder="Share an operational or resident update..." />
              <button type="submit" className="rf-button rf-button-dark mt-3 w-full">Post message</button>
            </form>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Moderated content remains auditable. Reports do not automatically remove a message.</p>
          </aside>
        </div>
      )}
    </>
  );
}
