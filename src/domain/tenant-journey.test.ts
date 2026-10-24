import { describe, expect, it } from "vitest";
import { leaseCountdown, tenantNextStep } from "./tenant-journey";

const now = new Date("2026-10-24T09:00:00Z");
const base = { leaseId: "L1", obligation: null, endDate: new Date("2027-01-24T00:00:00Z"), now };

describe("tenant journey", () => {
  it("sends awaiting-payment tenants to the exact-amount pay screen", () => {
    const step = tenantNextStep({ ...base, status: "AWAITING_PAYMENT", obligation: "PENDING" });
    expect(step.href).toBe("/app/leases/L1/pay");
    expect(step.tone).toBe("action");
  });

  it("never treats a payment exception as paid", () => {
    const step = tenantNextStep({ ...base, status: "AWAITING_PAYMENT", obligation: "EXCEPTION" });
    expect(step.tone).toBe("warning");
    expect(step.href).toBe("/app/leases/L1");
  });

  it("routes renewal window and grace to renewal", () => {
    expect(tenantNextStep({ ...base, status: "RENEWAL_WINDOW", obligation: "PAID" }).href).toBe("/app/leases/L1/renew");
    expect(tenantNextStep({ ...base, status: "GRACE", obligation: "PAID" }).tone).toBe("warning");
  });

  it("points paid active leases to receipts", () => {
    expect(tenantNextStep({ ...base, status: "ACTIVE", obligation: "PAID" }).href).toBe("/app/receipts");
  });

  it("classifies countdown urgency around T-14 and T-7", () => {
    expect(leaseCountdown(new Date("2026-12-01T00:00:00Z"), now).urgency).toBe("calm");
    expect(leaseCountdown(new Date("2026-11-05T00:00:00Z"), now)).toMatchObject({ days: 12, urgency: "soon" });
    expect(leaseCountdown(new Date("2026-10-30T00:00:00Z"), now).urgency).toBe("urgent");
    expect(leaseCountdown(new Date("2026-10-24T00:00:00Z"), now).label).toBe("Ends today");
    expect(leaseCountdown(new Date("2026-10-20T00:00:00Z"), now)).toMatchObject({ days: -4, urgency: "over" });
  });
});

describe("lease rail", () => {
  it("marks the renewal stop current inside the window", async () => {
    const { leaseRail } = await import("./tenant-journey");
    const rail = leaseRail(new Date("2026-05-05T00:00:00Z"), new Date("2026-11-05T00:00:00Z"), now);
    expect(rail.progress).toBeGreaterThan(90);
    expect(rail.stops.map((stop) => stop.state)).toEqual(["done", "current", "upcoming", "upcoming"]);
  });
});
