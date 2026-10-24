import {describe,expect,it} from "vitest";
import {canListUnit,leaseStateAt,reconcileExactPayment} from "./rentflow";

describe("RentFlow domain rules",()=>{
 it("opens renewal window at T-14",()=>expect(leaseStateAt({status:"ACTIVE",endDate:new Date("2026-11-06"),now:new Date("2026-10-23")})).toBe("RENEWAL_WINDOW"));
 it("enters grace after end",()=>expect(leaseStateAt({status:"ACTIVE",endDate:new Date("2026-10-20"),now:new Date("2026-10-23")})).toBe("GRACE"));
 it("blocks public listing during active occupancy",()=>expect(canListUnit({listingEnabled:true,leaseState:"ACTIVE"})).toBe(false));
 it("requires exact payment",()=>expect(reconcileExactPayment({required:5100000,received:5000000,expectedCurrency:"TZS",receivedCurrency:"TZS",alreadyPaid:false}).effect).toBe("EXCEPTION"));
 it("makes duplicate confirmation a noop",()=>expect(reconcileExactPayment({required:5100000,received:5100000,expectedCurrency:"TZS",receivedCurrency:"TZS",alreadyPaid:true}).effect).toBe("NOOP"));
});

describe("lease lifecycle timing (Laravel LeaseMilestones parity)", () => {
  const end = new Date("2026-11-05T00:00:00Z");
  const at = (iso: string, status: Parameters<typeof leaseStateAt>[0]["status"] = "ACTIVE") => leaseStateAt({ status, endDate: end, now: new Date(iso) });

  it("opens renewal exactly 14 EAT days before the end", () => {
    expect(at("2026-10-21T20:00:00Z")).toBe("ACTIVE"); // 23:00 EAT 21 Oct
    expect(at("2026-10-21T21:15:00Z")).toBe("RENEWAL_WINDOW"); // 00:15 EAT 22 Oct
  });

  it("starts grace on the end date itself and expires after end + 7", () => {
    expect(at("2026-11-04T22:15:00Z", "RENEWAL_WINDOW")).toBe("GRACE"); // 01:15 EAT 5 Nov
    expect(at("2026-11-11T22:15:00Z", "GRACE")).toBe("GRACE"); // 12 Nov EAT = deadline day
    expect(at("2026-11-12T22:15:00Z", "GRACE")).toBe("EXPIRED"); // 13 Nov EAT
  });

  it("never moves a lease backwards and ignores states it does not own", () => {
    expect(at("2026-10-01T05:00:00Z", "GRACE")).toBe("GRACE");
    expect(at("2026-12-01T05:00:00Z", "AWAITING_PAYMENT")).toBe("AWAITING_PAYMENT");
  });
});
