import { describe, expect, it } from "vitest";
import { canAccessSection, canCreateSection, canManagePortfolio } from "./authorization";

describe("authorization", () => {
  it("keeps tenant access limited to own operational surfaces", () => {
    expect(canAccessSection("TENANT", "leases")).toBe(true);
    expect(canAccessSection("TENANT", "payments")).toBe(true);
    expect(canAccessSection("TENANT", "maintenance")).toBe(true);
    expect(canAccessSection("TENANT", "properties")).toBe(false);
    expect(canAccessSection("TENANT", "inquiries")).toBe(false);
    expect(canCreateSection("TENANT", "maintenance")).toBe(true);
    expect(canCreateSection("TENANT", "leases")).toBe(false);
  });

  it("keeps supervisor writes constrained", () => {
    expect(canAccessSection("SUPERVISOR", "units")).toBe(true);
    expect(canAccessSection("SUPERVISOR", "tenants")).toBe(true);
    expect(canAccessSection("SUPERVISOR", "payments")).toBe(false);
    expect(canCreateSection("SUPERVISOR", "maintenance")).toBe(true);
    expect(canCreateSection("SUPERVISOR", "notices")).toBe(true);
    expect(canCreateSection("SUPERVISOR", "units")).toBe(false);
  });

  it("allows portfolio management only for portfolio roles", () => {
    expect(canManagePortfolio("PLATFORM_ADMIN")).toBe(true);
    expect(canManagePortfolio("LANDLORD")).toBe(true);
    expect(canManagePortfolio("PROPERTY_ADMIN")).toBe(true);
    expect(canManagePortfolio("SUPERVISOR")).toBe(false);
    expect(canManagePortfolio("TENANT")).toBe(false);
  });
});
