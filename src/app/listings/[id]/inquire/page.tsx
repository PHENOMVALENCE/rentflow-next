import { redirect } from "next/navigation";

// The enquiry form lives on the listing page (Laravel parity); this route keeps old links working.
export default async function InquiryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ submitted?: string; unavailable?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const status = query.submitted === "1" ? "?enquiry=sent" : query.unavailable === "1" ? "?enquiry=unavailable" : "";
  redirect(`/listings/${encodeURIComponent(id)}${status}#enquire`);
}
