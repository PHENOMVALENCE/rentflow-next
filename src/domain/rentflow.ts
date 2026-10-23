export type LeaseState = "DRAFT"|"AWAITING_PAYMENT"|"ACTIVE"|"RENEWAL_WINDOW"|"GRACE"|"RENEWED"|"EXPIRED"|"TERMINATED";

const DAY = 86_400_000;

export function leaseStateAt(input:{status:LeaseState; endDate:Date; now:Date}):LeaseState {
  if (["DRAFT","AWAITING_PAYMENT","RENEWED","TERMINATED"].includes(input.status)) return input.status;
  const days = Math.ceil((input.endDate.getTime()-input.now.getTime())/DAY);
  if (days > 14) return "ACTIVE";
  if (days >= 0) return "RENEWAL_WINDOW";
  if (days >= -7) return "GRACE";
  return "EXPIRED";
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
