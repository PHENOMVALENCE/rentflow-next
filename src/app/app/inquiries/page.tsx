import Link from "next/link";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { getInquiryQueue } from "@/server/rentflow/inquiry-read-model";

export default async function InquiriesPage() {
  const session = await requireSession(["PLATFORM_ADMIN", "LANDLORD", "PROPERTY_ADMIN"]);
  const inquiries = await getInquiryQueue(session.organizationId);

  return (
    <>
      <PageHeader
        eyebrow="Leasing pipeline"
        title="Property inquiries"
        description="Follow public listing inquiries from first contact through qualification."
      />

      <div className="rf-card overflow-hidden">
        {inquiries.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted-strong)]">No property inquiries are waiting in your organization.</p>
        ) : inquiries.map((inquiry) => (
          <Link key={inquiry.id} href={`/app/inquiries/${inquiry.id}`} className="grid gap-4 border-b border-[var(--border)] p-5 last:border-b-0 hover:bg-slate-50 md:grid-cols-[1.1fr_1fr_.7fr_auto] md:items-center">
            <div><p className="font-medium">{inquiry.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{inquiry.phone}{inquiry.email ? ` · ${inquiry.email}` : ""}</p></div>
            <div><p className="text-sm font-medium">{inquiry.listingTitle}</p><p className="mt-1 text-xs text-[var(--muted)]">{inquiry.createdAt}</p></div>
            <Status>{inquiry.status}</Status>
            <span className="text-xs font-medium">{inquiry.prospectId ? "Prospect created" : "Review →"}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
