import { redirect } from "next/navigation";

export default async function SafetyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/notices/${id}`);
}
