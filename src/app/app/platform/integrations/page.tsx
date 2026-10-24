import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { isBriqOtpConfigured } from "@/server/integrations/briq-otp";
import { isBriqWhatsAppConfigured } from "@/server/integrations/briq-whatsapp";
import { isSmsGateConfigured } from "@/server/integrations/smsgate";
import { hasPrivateObjectStorage } from "@/server/storage/private-object-store";

export default async function PlatformIntegrationsPage() {
  await requireSession(["PLATFORM_ADMIN"]);

  const rows = [
    ["Snippe payments", Boolean(process.env.SNIPPE_API_KEY?.trim()), "Exact-term payment initiation and verified webhook reconciliation."],
    ["Briq identity OTP", isBriqOtpConfigured(), "Production identity verification for sign-up, invitations and Forgot PIN."],
    ["Notification SMS", process.env.NODE_ENV !== "production" && isSmsGateConfigured(), "SMSGate is supported only for local/test notification delivery. The production notification-SMS provider remains intentionally undecided."],
    ["Briq WhatsApp", isBriqWhatsAppConfigured(), "Template-only WhatsApp delivery. Keep disabled until the required message templates are approved."],
    ["Private object storage", hasPrivateObjectStorage(), "Local private storage is development-only; production needs a private remote object-store adapter."],
    ["Lifecycle cron", Boolean(process.env.CRON_SECRET?.trim()), "Secret protects the scheduled lease lifecycle endpoint."],
  ] as const;

  return (
    <>
      <PageHeader eyebrow="Platform operations" title="Integrations" description="Runtime readiness of external services without exposing credentials or secret values." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, ready, detail]) => (
          <div className="rf-card p-5" key={label}>
            <div className="flex items-start justify-between gap-3"><h2 className="font-medium">{label}</h2><Status>{ready ? "CONFIGURED" : "PENDING"}</Status></div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{detail}</p>
          </div>
        ))}
      </div>
    </>
  );
}
