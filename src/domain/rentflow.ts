export type LeaseState = "DRAFT"|"AWAITING_PAYMENT"|"ACTIVE"|"RENEWAL_WINDOW"|"GRACE"|"RENEWED"|"EXPIRED"|"TERMINATED";

const DAY = 86_400_000;

const EAT_OFFSET = 3 * 60 * 60 * 1000; // Africa/Dar_es_Salaam, UTC+3, no daylight saving
const RANK: Partial<Record<LeaseState, number>> = { ACTIVE: 1, RENEWAL_WINDOW: 2, GRACE: 3, EXPIRED: 4 };

/**
 * Scheduler target state, matching Laravel `LeaseMilestones::targetStatus`:
 * calendar days in East Africa Time; renewal opens at end − 14 days; grace starts on the end date;
 * expiry is the day after end + 7. Forward-only: a lease never moves back to an earlier state.
 * States the scheduler does not own (draft, awaiting payment, renewed, terminated) are returned unchanged.
 */
export function leaseStateAt(input:{status:LeaseState; endDate:Date; now:Date}):LeaseState {
  const current = RANK[input.status];
  if (current === undefined || input.status === "EXPIRED") return input.status;
  const shifted = new Date(input.now.getTime() + EAT_OFFSET);
  const today = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  const end = Date.UTC(input.endDate.getUTCFullYear(), input.endDate.getUTCMonth(), input.endDate.getUTCDate());
  const desired: LeaseState = today > end + 7 * DAY ? "EXPIRED" : today >= end ? "GRACE" : today >= end - 14 * DAY ? "RENEWAL_WINDOW" : "ACTIVE";
  return (RANK[desired] ?? 0) >= current ? desired : input.status;
}

export function canListUnit(input:{listingEnabled:boolean; leaseState:LeaseState|null}) {
  if (!input.listingEnabled) return false;
  if (!input.leaseState) return true;
  return ["EXPIRED","TERMINATED"].includes(input.leaseState);
}

export function reconcileExactPayment(input:{required:number; received:number; expectedCurrency:string; receivedCurrency:string; alreadyPaid:boolean}) {
  if (input.alreadyPaid) return {ok:true, effect:"NOOP" as const};
  if (input.expectedCurrency !== input.receivedCurrency || input.required !== input.received) return {ok:false, effect:"EXCEPTION" as const};
  return {ok:true, effect:"MARK_PAID" as const};
}
