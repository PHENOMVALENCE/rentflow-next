import Link from "next/link";
import { AuthAlert, AuthLayout } from "@/components/pub/auth";
import { notFound } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { db, hasDatabaseConfiguration } from "@/server/db";
import { requestLandlordAttachment } from "@/server/rentflow/attachment-actions";

export default async function JoinLandlordPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!hasDatabaseConfiguration()) notFound();
  const organization = await db.organization.findFirst({ where: { slug: code, active: true } });
  if (!organization) notFound();
  const session = await getSession();

  return (
    <AuthLayout>
      <div className="pub-auth-card">
        <h1>Join {organization.name}</h1>
        <p className="pub-auth-intro">This request links your RentFlow tenant account to the landlord workspace. The landlord reviews the attachment before your tenant record becomes active.</p>
        {!session ? (
          <div className="pub-auth-form">
            <Link href="/register?role=TENANT" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">Create tenant account</Link>
            <Link href="/login" className="pub-btn pub-btn-secondary pub-btn-lg pub-btn-block">Sign in first</Link>
          </div>
        ) : session.role !== "TENANT" ? (
          <div className="mt-5"><AuthAlert tone="error">Only tenant accounts can request attachment to a landlord workspace.</AuthAlert></div>
        ) : (
          <form action={requestLandlordAttachment} className="pub-auth-form">
            <input type="hidden" name="organizationId" value={organization.id} />
            <button type="submit" className="pub-btn pub-btn-primary pub-btn-lg pub-btn-block">Request landlord attachment</button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
