import { notFound } from "next/navigation";
import { PageHeader, Status } from "@/components/ui";
import { requireSession } from "@/server/auth/session";
import { hasDatabaseConfiguration } from "@/server/db";
import { isBriqOtpConfigured } from "@/server/integrations/briq-otp";
import { isBriqWhatsAppConfigured } from "@/server/integrations/briq-whatsapp";
import {
  getPlatformActivity,
  getPlatformIncidents,
  getPlatformNotifications,
  getPlatformOrganizations,
  getPlatformPayments,
  getPlatformUsers,
  type PlatformRow,
} from "@/server/rentflow/platform-read-model";
import { hasPrivateObjectStorage } from "@/server/storage/private-object-store";

const allowed = [
  "organizations",
  "users",
  "search",
  "activity",
  "incidents",
  "health",
  "jobs",
  "notifications",
  "integrations",
  "sessions",
  "security",
  "integrity",
  "quality",
  "analytics",
  "settings",
  "payments",
  "reconciliation",
] as const;

type PlatformSection = (typeof allowed)[number];

const metadata: Record<PlatformSection, { title: string; description: string }> = {
  organizations: { title: "Organizations", description: "Inspect workspaces, portfolio footprint and platform participation." },
  users: { title: "Users", description: "Review platform accounts, roles and sign-in activity." },
  search: { title: "Platform search", description: "Cross-platform search surface for operational investigations." },
  activity: { title: "Activity", description: "Chronological audit evidence across organizations and platform actions." },
  incidents: { title: "Incidents", description: "Track operational failures through acknowledgement and resolution." },
  health: { title: "Platform health", description: "Runtime, database and integration readiness for the deployed application." },
  jobs: { title: "Scheduled jobs", description: "Lifecycle cron responsibilities, idempotency and execution readiness." },
  notifications: { title: "Notifications", description: "Inspect lifecycle communication and delivery state." },
  integrations: { title: "Integrations", description: "External provider readiness without exposing credentials." },
  sessions: { title: "Sessions", description: "Authentication session controls and expiry policy." },
  security: { title: "Security", description: "Operational security controls, secret boundaries and privileged access." },
  integrity: { title: "Data integrity", description: "Critical RentFlow invariants that must remain authoritative." },
  quality: { title: "Quality", description: "Engineering quality gates for safe delivery." },
  analytics: { title: "Analytics", description: "Platform-wide operational indicators and adoption signals." },
  settings: { title: "Platform settings", description: "Runtime-owned platform configuration and production gates." },
  payments: { title: "Platform payments", description: "Inspect settlement state across all organizations." },
  reconciliation: { title: "Reconciliation", description: "Focus on payment exceptions and exact-term settlement integrity." },
};

export default async function PlatformSectionPage({ params }: { params: Promise<{ section: string }> }) {
  await requireSession(["PLATFORM_ADMIN"]);
  const { section: rawSection } = await params;
  if (!allowed.includes(rawSection as PlatformSection)) notFound();
  const section = rawSection as PlatformSection;
  const meta = metadata[section];

  return (
    <>
      <PageHeader eyebrow="Platform operations" title={meta.title} description={meta.description} />
      {await renderSection(section)}
    </>
  );
}

async function renderSection(section: PlatformSection) {
  if (section === "organizations") return <Rows rows={await getPlatformOrganizations()} empty="No organizations found." />;
  if (section === "users") return <Rows rows={await getPlatformUsers()} empty="No users found." />;
  if (section === "activity") return <Rows rows={await getPlatformActivity()} empty="No audit activity found." />;
  if (section === "incidents") return <Rows rows={await getPlatformIncidents()} empty="No incidents recorded." />;
  if (section === "notifications") return <Rows rows={await getPlatformNotifications()} empty="No notifications recorded." />;
  if (section === "payments") return <Rows rows={await getPlatformPayments()} empty="No payment transactions recorded." />;
  if (section === "reconciliation") {
    const rows = (await getPlatformPayments()).filter((row) => row.status === "EXCEPTION" || row.status === "FAILED" || row.status === "PENDING");
    return <Rows rows={rows} empty="No payment exceptions require review." />;
  }

  if (section === "health") {
    const cards = [
      ["Application", "READY", "Next.js runtime and health route are part of the deployed surface."],
      ["Database", hasDatabaseConfiguration() ? "CONFIGURED" : "BLOCKED", hasDatabaseConfiguration() ? "DATABASE_URL is present in this runtime." : "Attach PostgreSQL and deploy Prisma migrations before production transaction flows."],
      ["Authentication", process.env.AUTH_SECRET ? "CONFIGURED" : "BLOCKED", process.env.AUTH_SECRET ? "AUTH_SECRET is configured." : "Production authentication requires AUTH_SECRET."],
      ["Cron", process.env.CRON_SECRET ? "CONFIGURED" : "BLOCKED", process.env.CRON_SECRET ? "Lifecycle cron secret is configured." : "Set CRON_SECRET before enabling lifecycle automation."],
    ];
    return <DiagnosticCards rows={cards} />;
  }

  if (section === "integrations") {
    const cards = [
      ["Snippe", process.env.SNIPPE_API_KEY ? "CONFIGURED" : "PENDING", "Exact-term payment initiation and webhook reconciliation adapter."],
      ["Briq OTP / SMS", isBriqOtpConfigured() ? "CONFIGURED" : "PENDING", "Briq API credentials are required before OTP/SMS delivery can be enabled."],
      ["Briq WhatsApp", isBriqWhatsAppConfigured() ? "CONFIGURED" : "PENDING", "WhatsApp remains off until the provider is enabled and approved templates are available."],
      ["Private storage", hasPrivateObjectStorage() ? "CONFIGURED" : "PENDING", "Agreement, maintenance and listing media require an authorized private object-store adapter."],
    ];
    return <DiagnosticCards rows={cards} />;
  }

  if (section === "jobs") {
    return <DiagnosticCards rows={[
      ["Lease lifecycle", "IMPLEMENTED", "T-14 renewal window, grace and expiry transitions are processed idempotently."],
      ["Payment callbacks", "EVENT-DRIVEN", "Provider callbacks reconcile verified events and reject mismatched settlement."],
      ["Notification delivery", "PARTIAL", "In-app records are implemented; external delivery adapters remain infrastructure-gated."],
      ["Retry strategy", "REQUIRED", "Production provider jobs should use bounded retries and correlation IDs."],
    ]} />;
  }

  if (section === "sessions") {
    return <DiagnosticCards rows={[
      ["Cookie", "HTTP-ONLY", "Session token is inaccessible to browser JavaScript."],
      ["SameSite", "LAX", "Session cookie limits cross-site request attachment."],
      ["TTL", "12 HOURS", "Current signed application session lifetime."],
      ["Production signing", process.env.AUTH_SECRET ? "READY" : "BLOCKED", "AUTH_SECRET must be present when database persistence is enabled."],
    ]} />;
  }

  if (section === "security") {
    return <DiagnosticCards rows={[
      ["Authorization", "SERVER-SIDE", "Role and organization/resource scope checks execute on server paths."],
      ["Provider secrets", "ENV ONLY", "Payment and communication credentials must never be persisted in business tables or Git."],
      ["Audit trail", "APPEND-ONLY", "Privileged business actions emit audit evidence."],
      ["Legacy Laravel secrets", "ROTATION REQUIRED", "The Laravel repository historically contained an .env file; exposed credentials must be rotated before production reuse."],
    ]} />;
  }

  if (section === "integrity") {
    return <DiagnosticCards rows={[
      ["Occupancy", "LEASE STATE", "Unit occupancy is derived from protected lease states, never a mutable unit flag."],
      ["Lease terms", "3 OR 6 MONTHS", "Term length is constrained by domain validation."],
      ["Payment", "EXACT FULL TERM", "Only verified exact settlement can activate or renew a lease."],
      ["Listing", "OCCUPANCY-GATED", "Public publication is blocked while a protected occupancy relationship exists."],
    ]} />;
  }

  if (section === "quality") {
    return <DiagnosticCards rows={[
      ["Typecheck", "REQUIRED", "TypeScript validation is part of CI."],
      ["Unit tests", "REQUIRED", "Domain tests execute before merge."],
      ["Production build", "REQUIRED", "Next.js build must succeed before merge."],
      ["PR workflow", "AUTOMATED", "codex/masterchanges is merged only after quality gates succeed."],
    ]} />;
  }

  if (section === "analytics") {
    const organizations = await getPlatformOrganizations();
    const users = await getPlatformUsers();
    const incidents = await getPlatformIncidents();
    const payments = await getPlatformPayments();
    return <DiagnosticCards rows={[
      ["Organizations", String(organizations.length), "Current visible platform workspaces."],
      ["Users", String(users.length), "Current visible platform accounts."],
      ["Open incidents", String(incidents.filter((row) => row.status !== "RESOLVED").length), "Platform incidents requiring attention."],
      ["Payment exceptions", String(payments.filter((row) => row.status === "EXCEPTION").length), "Settlement records requiring manual review."],
    ]} />;
  }

  if (section === "search") {
    return <DiagnosticCards rows={[
      ["Organizations", "INDEXED", "Search targets organization name and workspace context."],
      ["Users", "INDEXED", "Search targets user identity and role metadata."],
      ["Payments", "INDEXED", "Search targets internal and provider references."],
      ["Audit", "INDEXED", "Search targets action/resource evidence; sensitive payloads remain excluded."],
    ]} />;
  }

  return <DiagnosticCards rows={[
    ["Configuration ownership", "RUNTIME", "Secrets and provider credentials remain environment-owned."],
    ["Organization settings", "SCOPED", "Tenant-facing and landlord settings remain organization-specific."],
    ["Production gate", hasDatabaseConfiguration() ? "DATABASE READY" : "DATABASE PENDING", "Persistent transaction flows require PostgreSQL migrations and bootstrap data."],
  ]} />;
}

function Rows({ rows, empty }: { rows: PlatformRow[]; empty: string }) {
  if (rows.length === 0) return <div className="rf-card p-8 text-center text-sm text-[var(--muted-strong)]">{empty}</div>;
  return <div className="rf-card overflow-hidden">{rows.map((row) => <div key={row.id} className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 md:grid-cols-[1.4fr_.9fr_auto] md:items-center"><div><p className="font-medium">{row.primary}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.secondary}</p></div><span className="text-xs text-[var(--muted)]">{row.meta}</span><div className="md:text-right"><Status>{row.status}</Status></div></div>)}</div>;
}

function DiagnosticCards({ rows }: { rows: readonly (readonly string[])[] }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map(([label = "", status = "", detail = ""]) => <div className="rf-card p-5" key={label}><div className="flex items-start justify-between gap-3"><h2 className="font-medium">{label}</h2><Status>{status}</Status></div><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{detail}</p></div>)}</div>;
}
