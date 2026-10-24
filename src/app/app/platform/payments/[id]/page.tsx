import Link from "next/link";
import { notFound } from "next/navigation";
import { AuditList, Facts, PageHeader, Panel, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getPaymentDetail } from "@/server/rentflow/platform-detail-read-model";

export const metadata = { title: "Payment" };

export default async function PlatformPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession(["PLATFORM_ADMIN"]);
  const payment = await getPaymentDetail((await params).id);
  if (!payment) notFound();

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/app/platform/payments" className="rf-link">← Payment operations</Link></p>
      <PageHeader
        eyebrow="Platform · Payment"
        title={payment.internalReference}
        description="Normalized provider result and the exact full-term obligation it was matched against. Raw provider payloads are not stored or shown."
        action={<Status>{payment.status}</Status>}
      />
      {!payment.matches && (
        <div className="rf-context-banner" role="alert">
          <div>
            <p className="caption font-medium uppercase tracking-[0.12em] text-[#a8071a]">Not paid</p>
            <p className="mt-1 text-sm text-neutral-900">The received amount does not equal the obligation, so the lease was not activated or renewed.</p>
          </div>
        </div>
      )}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Panel title="Provider result">
            <Facts items={[["Provider", payment.provider], ["Provider reference", payment.providerReference && <span className="rf-mono">{payment.providerReference}</span>], ["Requested", payment.requested], ["Received", payment.received], ["Failure reason", payment.failureReason], ["Last update", payment.updated]]} />
          </Panel>
          <Panel title="Audit" subtitle="Reconciliation evidence" flush>
            <AuditList rows={payment.audit} />
          </Panel>
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <Panel title="Obligation">
            <Facts items={[["Status", <Status key="o">{payment.obligationStatus}</Status>], ["Exact amount", payment.obligationAmount], ["Unit", payment.unit], ["Organization", payment.organization && <Link key="org" href={`/app/platform/organizations/${payment.organization.id}`} className="rf-link">{payment.organization.name}</Link>], ["Created", payment.created]]} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
