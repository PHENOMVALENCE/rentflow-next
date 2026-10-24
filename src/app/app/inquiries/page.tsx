import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Empty, PageHeader, Panel, Status } from "@/components/ui";
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

      {inquiries.length === 0 ? (
        <Empty icon="inbox" title="No property inquiries">New public listing inquiries for your organization will appear here.</Empty>
      ) : (
        <Panel title="Inquiry queue" subtitle={`${inquiries.length} ${inquiries.length === 1 ? "inquiry" : "inquiries"} awaiting or moving through review`} flush>
          <ul className="rf-list">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <Link href={`/app/inquiries/${inquiry.id}`} className="rf-list-row">
                  <span className="rf-list-icon" aria-hidden="true"><AppIcon name="chat" className="h-[18px] w-[18px]" /></span>
                  <span className="rf-list-main">
                    <span className="rf-list-title block">{inquiry.name}</span>
                    <span className="rf-list-meta block">{inquiry.phone}{inquiry.email ? ` · ${inquiry.email}` : ""}</span>
                    <span className="rf-list-meta block">{inquiry.listingTitle} · {inquiry.createdAt}</span>
                  </span>
                  <span className="rf-list-aside">
                    <Status>{inquiry.status}</Status>
                    <span className="text-xs text-[var(--muted)]">{inquiry.prospectId ? "Prospect created" : "Needs review"}</span>
                  </span>
                  <AppIcon name="chevron-right" className="rf-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
