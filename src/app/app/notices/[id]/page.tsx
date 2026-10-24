import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { acknowledgeSafetyNotice } from "@/server/rentflow/notice-actions";
import { getSafetyNoticeDetail } from "@/server/rentflow/notice-read-model";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function NoticeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  if (!hasDatabaseConfiguration()) {
    return (
      <>
        <PageHeader eyebrow="Safety notice" title="Notice detail" description="Acknowledgement evidence requires the production database." />
        <div className="rf-card max-w-2xl p-6"><Link href="/app/notices" className="rf-button rf-button-light">Back to notices</Link></div>
      </>
    );
  }

  const notice = await getSafetyNoticeDetail(id, session);
  if (!notice) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Safety notice"
        title={notice.title}
        description={notice.propertyId ? "Property-scoped operational notice" : "Organization-wide operational notice"}
        action={<Link href="/app/notices" className="rf-button rf-button-light">Back</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rf-card p-6">
          <div className="flex flex-wrap items-center gap-3"><Status>{notice.severity}</Status>{notice.expired && <Status>Expired</Status>}</div>
          <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-strong)]">{notice.body}</p>
          <dl className="mt-8 grid gap-4 border-t border-[var(--border)] pt-5 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-[var(--muted)]">Published</dt><dd className="mt-1 font-medium">{notice.publishedAt ? date.format(notice.publishedAt) : "Not published"}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Expires</dt><dd className="mt-1 font-medium">{notice.expiresAt ? date.format(notice.expiresAt) : "No expiry"}</dd></div>
          </dl>
        </section>

        <aside className="rf-card h-fit p-5">
          <h2 className="font-semibold">Acknowledgement</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">Acknowledgements are recorded as operational evidence and remain associated with your account.</p>
          <p className="mt-5 text-3xl font-semibold">{notice.acknowledgementCount}</p>
          <p className="text-xs text-[var(--muted)]">recorded acknowledgements</p>

          {notice.acknowledgedAt ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">You acknowledged this notice on {date.format(notice.acknowledgedAt)}.</div>
          ) : (
            <form action={acknowledgeSafetyNotice} className="mt-5">
              <input type="hidden" name="noticeId" value={notice.id} />
              <button type="submit" className="rf-button rf-button-dark w-full">Acknowledge notice</button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
