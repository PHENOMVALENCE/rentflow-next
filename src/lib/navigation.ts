import type { AppIconName } from "@/components/icons";

export type NavRole = "PLATFORM_ADMIN" | "LANDLORD" | "PROPERTY_ADMIN" | "SUPERVISOR" | "TENANT";

export type NavItem = {
  label: string;
  hint: string;
  href: string;
  icon: AppIconName;
  /** Path prefixes that mark this item active, in addition to `href`. */
  match?: string[];
};

export type NavGroup = { group: string | null; items: NavItem[] };

export const ROLE_LABELS: Record<NavRole, string> = {
  PLATFORM_ADMIN: "System admin",
  LANDLORD: "Organization admin",
  PROPERTY_ADMIN: "Property admin",
  SUPERVISOR: "Supervisor",
  TENANT: "Tenant",
};

const home = (hint: string): NavItem => ({ label: "Home", hint, href: "/app", icon: "home" });
const notices: NavItem = { label: "Notices", hint: "Messages and safety alerts", href: "/app/notices", icon: "bell", match: ["/app/notifications"] };
const catalogue: NavItem = { label: "Available units", hint: "Public catalogue", href: "/", icon: "building" };
const profile: NavItem = { label: "Profile", hint: "Your account in this organization", href: "/app/profile", icon: "user", match: ["/app/account", "/app/pin"] };
const safety: NavItem = { label: "Safety", hint: "Official building notices", href: "/app/safety", icon: "shield" };

/**
 * Role navigation mirrored from Laravel `layouts/partials/nav.blade.php`.
 * Navigation only hides links; every page still re-checks authorization server-side.
 */
export function navigationFor(role: NavRole): NavGroup[] {
  if (role === "TENANT") {
    return [
      { group: "Overview", items: [home("Your unit and lease"), notices] },
      {
        group: "Your tenancy",
        items: [
          { label: "Lease", hint: "Term, renewal and payment", href: "/app/leases", icon: "calendar", match: ["/app/onboarding"] },
          { label: "Agreements", hint: "Your lease files", href: "/app/agreements", icon: "file" },
          { label: "Receipts", hint: "Verified payment evidence", href: "/app/receipts", icon: "card", match: ["/app/payments"] },
          { label: "Maintenance", hint: "Requests for your unit", href: "/app/maintenance", icon: "wrench" },
        ],
      },
      {
        group: "Communication",
        items: [{ ...safety, icon: "alert" }, { label: "Community", hint: "Neighbour chat for your building", href: "/app/community", icon: "chat" }],
      },
      { group: "Explore", items: [catalogue] },
      { group: "Account", items: [profile] },
    ];
  }

  if (role === "SUPERVISOR") {
    return [
      { group: "Overview", items: [home("Your assigned places"), notices] },
      { group: "Portfolio", items: [{ label: "Properties", hint: "Buildings assigned to you", href: "/app/properties", icon: "building", match: ["/app/units", "/app/listings"] }] },
      {
        group: "Rental operations",
        items: [
          { label: "Tenants", hint: "Occupants on those buildings", href: "/app/tenants", icon: "users", match: ["/app/leases"] },
          { label: "Receipts", hint: "Verified payments in your places", href: "/app/receipts", icon: "card" },
          { label: "Maintenance", hint: "Requests in your places", href: "/app/maintenance", icon: "wrench" },
        ],
      },
      {
        group: "Communication",
        items: [
          { label: "Enquiries", hint: "Public leads in your places", href: "/app/inquiries", icon: "inbox" },
          { ...safety, icon: "alert" },
          { label: "Community", hint: "Rooms in your places", href: "/app/community", icon: "chat" },
        ],
      },
      { group: "Account", items: [profile] },
    ];
  }

  const organization: NavGroup[] = [
    {
      group: "Portfolio",
      items: [
        { label: "Properties", hint: "Buildings and units", href: "/app/properties", icon: "building", match: ["/app/units", "/app/listings"] },
        { label: "Supervisors", hint: "Property assignments", href: "/app/supervisors", icon: "map" },
        { label: "Standard leases", hint: "3- and 6-month files", href: "/app/standard-leases", icon: "file" },
        ...(role === "PROPERTY_ADMIN" ? [] : [{ label: "Organization", hint: "Logo and letterhead", href: "/app/organization", icon: "briefcase" } satisfies NavItem]),
      ],
    },
    {
      group: "Rental operations",
      items: [
        { label: "Tenants", hint: "People and tenancies", href: "/app/tenants", icon: "users", match: ["/app/leases", "/app/agreements"] },
        { label: "Requests", hint: "Digital attachment", href: "/app/attachment-requests", icon: "file" },
        { label: "Unpaid terms", hint: "Waiting for payment", href: "/app/unpaid-terms", icon: "wallet" },
        { label: "Receipts", hint: "Verified payment evidence", href: "/app/receipts", icon: "card", match: ["/app/payments"] },
        { label: "Exceptions", hint: "Amount mismatches", href: "/app/payment-exceptions", icon: "alert" },
        { label: "Maintenance", hint: "Requests in your scope", href: "/app/maintenance", icon: "wrench" },
        { label: "Documents", hint: "Operational files", href: "/app/operational-documents", icon: "sheet" },
      ],
    },
    {
      group: "Communication",
      items: [
        { label: "Enquiries", hint: "Public listing leads", href: "/app/inquiries", icon: "inbox" },
        safety,
        { label: "Community", hint: "Rooms in your scope", href: "/app/community", icon: "chat" },
      ],
    },
    { group: "Insights", items: [{ label: "Reports", hint: "Operational records and exports", href: "/app/reports", icon: "chart" }] },
  ];

  if (role === "PLATFORM_ADMIN") {
    const platform = (section: string, label: string, hint: string, icon: AppIconName): NavItem => ({ label, hint, href: `/app/platform/${section}`, icon });
    return [
      { group: null, items: [{ label: "Overview", hint: "Platform command center", href: "/app/platform", icon: "home", match: ["/app"] }] },
      {
        group: "Workspace",
        items: [
          platform("organizations", "Organizations", "All landlords on RentFlow", "building"),
          platform("users", "Users & access", "Accounts, roles, sign-in help", "users"),
          platform("search", "Search", "People, places, leases, files, activity", "search"),
        ],
      },
      {
        group: "Operations",
        items: [
          platform("activity", "Activity", "Audit events across the platform", "clock"),
          platform("incidents", "Incidents", "Grouped failures and errors", "alert"),
          platform("health", "System health", "What can be verified right now", "zap"),
          platform("jobs", "Background jobs", "Failed jobs, without payloads", "refresh"),
          platform("notifications", "Notifications", "SMS and email telemetry", "bell"),
          platform("integrations", "Integrations", "Providers, without secrets", "wrench"),
        ],
      },
      {
        group: "Payments",
        items: [
          platform("payments", "Payment operations", "Attempts, callbacks, exceptions", "card"),
          platform("reconciliation", "Reconciliation", "Stored mismatches, not rent reports", "check"),
        ],
      },
      {
        group: "Security",
        items: [
          platform("security", "Security center", "Accounts, sessions, unmonitored gaps", "lock"),
          platform("sessions", "Sessions", "Stored sessions, never tokens", "eye"),
        ],
      },
      {
        group: "Data & audit",
        items: [
          platform("integrity", "Data integrity", "Stored mismatches, not a quality score", "file"),
          platform("quality", "Data quality", "Incomplete stored records", "file"),
          platform("analytics", "Platform analytics", "Stored counts, not product telemetry", "calendar"),
        ],
      },
      ...organization.map((group) => ({ ...group, group: `Organization · ${group.group}` })),
      { group: "System", items: [platform("settings", "Settings", "Runtime config, not a secret editor", "menu"), catalogue] },
    ];
  }

  return [
    { group: "Overview", items: [home("Lease and occupancy snapshot"), notices] },
    ...organization,
    { group: "Account", items: [profile, ...(role === "LANDLORD" ? [{ label: "Settings", hint: "Geography and preferences", href: "/app/settings", icon: "menu" } satisfies NavItem] : [])] },
  ];
}

/** True when `pathname` is the item's page or a page nested under it (or under an extra match prefix). */
export function isNavItemActive(item: NavItem, pathname: string) {
  const under = (prefix: string) => pathname === prefix || (prefix !== "/" && prefix !== "/app" && pathname.startsWith(`${prefix}/`));
  if (item.href === "/app" || item.href === "/") return pathname === item.href || (item.match ?? []).some((prefix) => pathname === prefix);
  return under(item.href) || (item.match ?? []).some(under);
}

export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return `${words[0][0] ?? ""}${words.length > 1 ? (words[words.length - 1][0] ?? "") : ""}`.toUpperCase();
}

/** Stable avatar tone (Laravel uses crc32 % 6); a simple string hash is enough for colour selection. */
export function avatarTone(name: string) {
  let hash = 0;
  for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 6;
}
