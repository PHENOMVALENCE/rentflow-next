import { describe, expect, it } from "vitest";
import { createRenewalPlan } from "./renewal";

describe("createRenewalPlan", () => {
  it("creates a successor at the predecessor end boundary", () => {
    const plan = createRenewalPlan({
      predecessorLeaseId: "lease-1",
      predecessorStatus: "RENEWAL_WINDOW",
      predecessorEndDate: new Date("2027-01-31T00:00:00.000Z"),
      termMonths: 3,
      monthlyRent: 500_000,
    });

    expect(plan.startDate.toISOString()).toBe("2027-01-31T00:00:00.000Z");
    expect(plan.endDate.toISOString()).toBe("2027-04-30T00:00:00.000Z");
    expect(plan.fullTermAmount).toBe(1_500_000);
    expect(plan.currency).toBe("TZS");
  });

  it("allows renewal during grace", () => {
    expect(() => createRenewalPlan({
      predecessorLeaseId: "lease-1",
      predecessorStatus: "GRACE",
      predecessorEndDate: new Date("2027-02-01T00:00:00.000Z"),
      termMonths: 6,
      monthlyRent: 350_000,
    })).not.toThrow();
  });

  it("rejects renewal before the renewal window", () => {
    expect(() => createRenewalPlan({
      predecessorLeaseId: "lease-1",
      predecessorStatus: "ACTIVE",
      predecessorEndDate: new Date("2027-02-01T00:00:00.000Z"),
      termMonths: 3,
      monthlyRent: 350_000,
    })).toThrow("not currently renewable");
  });

  it("rejects unsupported terms and non-whole TZS rent", () => {
    expect(() => createRenewalPlan({
      predecessorLeaseId: "lease-1",
      predecessorStatus: "RENEWAL_WINDOW",
      predecessorEndDate: new Date("2027-02-01T00:00:00.000Z"),
      termMonths: 12,
      monthlyRent: 350_000,
    })).toThrow("exactly 3 or 6 months");

    expect(() => createRenewalPlan({
      predecessorLeaseId: "lease-1",
      predecessorStatus: "GRACE",
      predecessorEndDate: new Date("2027-02-01T00:00:00.000Z"),
      termMonths: 3,
      monthlyRent: 350_000.5,
    })).toThrow("whole TZS");
  });
});
