export type RenewableLeaseState = "RENEWAL_WINDOW" | "GRACE";

export type RenewalPlan = {
  predecessorLeaseId: string;
  termMonths: 3 | 6;
  startDate: Date;
  endDate: Date;
  fullTermAmount: number;
  currency: "TZS";
};

function addUtcMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const target = new Date(Date.UTC(year, month + months, 1, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

export function createRenewalPlan(input: {
  predecessorLeaseId: string;
  predecessorStatus: string;
  predecessorEndDate: Date;
  termMonths: number;
  monthlyRent: number;
}): RenewalPlan {
  if (input.predecessorStatus !== "RENEWAL_WINDOW" && input.predecessorStatus !== "GRACE") {
    throw new Error("Lease is not currently renewable.");
  }

  if (input.termMonths !== 3 && input.termMonths !== 6) {
    throw new Error("Renewal term must be exactly 3 or 6 months.");
  }

  if (!Number.isSafeInteger(input.monthlyRent) || input.monthlyRent <= 0) {
    throw new Error("Monthly rent must be a positive whole TZS value.");
  }

  const fullTermAmount = input.monthlyRent * input.termMonths;
  if (!Number.isSafeInteger(fullTermAmount) || fullTermAmount <= 0) {
    throw new Error("Full-term amount must be a positive whole TZS value.");
  }

  const startDate = new Date(input.predecessorEndDate);
  const endDate = addUtcMonths(startDate, input.termMonths);

  if (!(endDate > startDate)) throw new Error("Renewal end date must be after its start date.");

  return {
    predecessorLeaseId: input.predecessorLeaseId,
    termMonths: input.termMonths,
    startDate,
    endDate,
    fullTermAmount,
    currency: "TZS",
  };
}
