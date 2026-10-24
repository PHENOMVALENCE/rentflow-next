import { describe, expect, it } from "vitest";
import { initialsOf, isNavItemActive, navigationFor } from "./navigation";

const hrefs = (role: Parameters<typeof navigationFor>[0]) => navigationFor(role).flatMap((group) => group.items.map((item) => item.href));

describe("role navigation", () => {
  it("keeps tenants away from portfolio and financial operations", () => {
    const tenant = hrefs("TENANT");
    expect(tenant).toContain("/app/receipts");
    expect(tenant).not.toContain("/app/properties");
    expect(tenant).not.toContain("/app/payment-exceptions");
    expect(tenant).not.toContain("/app/unpaid-terms");
  });

  it("excludes unrelated portfolio finance from supervisors", () => {
    const supervisor = hrefs("SUPERVISOR");
    expect(supervisor).not.toContain("/app/unpaid-terms");
    expect(supervisor).not.toContain("/app/payment-exceptions");
    expect(supervisor).not.toContain("/app/reports");
  });

  it("matches nested pages to their parent item", () => {
    const tenants = navigationFor("LANDLORD").flatMap((group) => group.items).find((item) => item.href === "/app/tenants")!;
    expect(isNavItemActive(tenants, "/app/leases/abc/renew")).toBe(true);
    expect(isNavItemActive(tenants, "/app/tenants-archive")).toBe(false);
    const home = navigationFor("LANDLORD")[0].items[0];
    expect(isNavItemActive(home, "/app/properties")).toBe(false);
  });

  it("derives initials from first and last names", () => {
    expect(initialsOf("  Rehema  Ali Kweka ")).toBe("RK");
    expect(initialsOf("")).toBe("?");
  });
});
