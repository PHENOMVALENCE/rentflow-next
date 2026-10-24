import Link from "next/link";
import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/server/auth/actions";

const roleNav: Record<Role, string[]> = {
  PLATFORM_ADMIN: ["dashboard", "platform", "properties", "units", "listings", "inquiries", "tenants", "attachment-requests", "leases", "standard-leases", "payments", "receipts", "payment-exceptions", "unpaid-terms", "supervisors", "maintenance", "notices", "operational-documents", "organization", "reports", "settings"],
  LANDLORD: ["dashboard", "properties", "units", "listings", "inquiries", "tenants", "attachment-requests", "leases", "standard-leases", "payments", "receipts", "payment-exceptions", "unpaid-terms", "supervisors", "maintenance", "notices", "operational-documents", "organization", "reports", "settings"],
  PROPERTY_ADMIN: ["dashboard", "properties", "units", "listings", "inquiries", "tenants", "attachment-requests", "leases", "standard-leases", "payments", "receipts", "payment-exceptions", "unpaid-terms", "supervisors", "maintenance", "notices", "operational-documents", "organization", "reports"],
  SUPERVISOR: ["dashboard", "units", "tenants", "receipts", "maintenance", "notices"],
  TENANT: ["dashboard", "leases", "agreements", "payments", "receipts", "maintenance", "notices"],
};

const navLabels: Record<string, string> = {
  "attachment-requests": "Attachment requests",
  "standard-leases": "Standard leases",
  "operational-documents": "Operational documents",
  "payment-exceptions": "Payment exceptions",
  "unpaid-terms": "Unpaid terms",
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "RF";
}

export function AppShell({ children, role, userName, workspaceName, demoMode }: { children: ReactNode; role: Role; userName: string; workspaceName: string; demoMode: boolean }) {
  const nav = roleNav[role];
  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-[var(--border)] bg-[var(--sidebar)] p-5 lg:flex lg:flex-col">
        <Link href="/" className="mb-8 text-xl font-semibold"><span className="text-[var(--brand)]">Rent</span>Flow</Link>
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-3"><p className="text-xs text-[var(--muted)]">Workspace</p><p className="mt-1 font-medium">{workspaceName}</p><p className="mt-1 text-xs text-[var(--muted)]">{role.toLowerCase().replaceAll("_", " ")}</p></div>
        <nav className="space-y-1">{nav.map((item) => <Link key={item} href={item === "dashboard" ? "/app" : `/app/${item}`} className="block rounded-xl px-3 py-2.5 text-sm text-[var(--muted-strong)] hover:bg-white hover:text-black">{navLabels[item] ?? item.replaceAll("-", " ")}</Link>)}</nav>
        <div className="mt-auto space-y-3 text-xs text-[var(--muted)]"><Link href="/app/account" className="block text-[var(--muted-strong)] hover:text-black">Account & security</Link><p>RentFlow Next · {demoMode ? "Preview" : "Production"}</p>{!demoMode && <form action={logoutAction}><button className="text-left text-[var(--muted-strong)] hover:text-black">Sign out</button></form>}</div>
      </aside>
      <div><header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-5 lg:px-8"><div><p className="text-xs text-[var(--muted)]">Property operations</p><p className="text-sm font-medium">{workspaceName}</p></div><div className="flex items-center gap-3"><span className={`rf-badge ${demoMode ? "" : "rf-badge-success"}`}>{demoMode ? "Demo data" : "System healthy"}</span><Link href="/app/account" className="grid h-9 w-9 place-items-center rounded-full bg-black text-sm text-white" title={`${userName} · Account & security`}>{initials(userName)}</Link></div></header><main className="p-5 lg:p-8">{children}</main></div>
    </div>
  );
}
