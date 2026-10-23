import {describe,expect,it} from "vitest";
import {canListUnit,leaseStateAt,reconcileExactPayment} from "./rentflow";

describe("RentFlow domain rules",()=>{
 it("opens renewal window at T-14",()=>expect(leaseStateAt({status:"ACTIVE",endDate:new Date("2026-11-06"),now:new Date("2026-10-23")})).toBe("RENEWAL_WINDOW"));
 it("enters grace after end",()=>expect(leaseStateAt({status:"ACTIVE",endDate:new Date("2026-10-20"),now:new Date("2026-10-23")})).toBe("GRACE"));
 it("blocks public listing during active occupancy",()=>expect(canListUnit({listingEnabled:true,leaseState:"ACTIVE"})).toBe(false));
 it("requires exact payment",()=>expect(reconcileExactPayment({required:5100000,received:5000000,expectedCurrency:"TZS",receivedCurrency:"TZS",alreadyPaid:false}).effect).toBe("EXCEPTION"));
 it("makes duplicate confirmation a noop",()=>expect(reconcileExactPayment({required:5100000,received:5100000,expectedCurrency:"TZS",receivedCurrency:"TZS",alreadyPaid:true}).effect).toBe("NOOP"));
});
