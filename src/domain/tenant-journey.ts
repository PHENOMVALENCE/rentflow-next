/**
 * Tenant home "next step" and countdown, mirroring the Laravel tenant journey
 * (`livewire/app/home-tenant.blade.php`). Pure: callers pass authoritative lease
 * and obligation state; nothing here changes state.
 */

export type JourneyLeaseStatus = "DRAFT" | "AWAITING_PAYMENT" | "ACTIVE" | "RENEWAL_WINDOW" | "GRACE" | "RENEWED" | "EXPIRED" | "TERMINATED";
export type JourneyObligationStatus = "PENDING" | "PAID" | "EXCEPTION" | "CANCELLED";

export type JourneyInput = {
  leaseId: string;
  status: JourneyLeaseStatus;
  obligation: JourneyObligationStatus | null;
  endDate: Date;
  now: Date;
  /** Formatted exact amount and term length for the renewal sentence (Laravel wording). */
  amount?: string;
  termMonths?: number;
};

export type NextStep = {
  tone: "action" | "warning" | "resolved";
  label: string;
  title: string;
  body: string;
  /** Placeholder values for `body` (`:date`, `:amount`, `:months`), filled after translation. */
  bodyParams?: Record<string, string | number>;
  action: string;
  href: string;
};

export type Countdown = {
  /** Whole days until the term end; negative after it. */
  days: number;
  urgency: "calm" | "soon" | "urgent" | "over";
  /** English sentence; `:count` is filled from `labelParams` (or `days`) after translation. */
  label: string;
  labelParams?: Record<string, number>;
};

const DAY = 24 * 60 * 60 * 1000;

export function leaseCountdown(endDate: Date, now: Date): Countdown {
  const days = Math.ceil((startOfDay(endDate) - startOfDay(now)) / DAY);
  if (days < 0) return { days, urgency: "over", label: days === -1 ? "Ended 1 day ago" : "Ended :count days ago", labelParams: { count: -days } };
  if (days === 0) return { days, urgency: "urgent", label: "Ends today" };
  const label = days === 1 ? "1 day left" : ":count days left";
  const labelParams = { count: days };
  if (days <= 7) return { days, urgency: "urgent", label, labelParams };
  if (days <= 14) return { days, urgency: "soon", label, labelParams };
  return { days, urgency: "calm", label, labelParams };
}

export function tenantNextStep({ leaseId, status, obligation, endDate, now, amount, termMonths }: JourneyInput): NextStep {
  const lease = `/app/leases/${leaseId}`;

  if (obligation === "EXCEPTION") {
    return {
      tone: "warning",
      label: "Payment needs review",
      title: "Your payment did not match the exact amount",
      body: "A wrong or partial amount does not count as paid. Your property administrator will review it with you.",
      action: "Open lease",
      href: lease,
    };
  }

  switch (status) {
    case "DRAFT":
      return { tone: "action", label: "Next step", title: "Review this term", body: "Read the 3- or 6-month term. This is not a certified electronic signature.", action: "Review term", href: lease };
    case "AWAITING_PAYMENT":
      return { tone: "action", label: "Next step", title: "Pay this term", body: "Pay the exact full-term amount. Pending is not paid until RentFlow confirms.", action: "Pay exact amount", href: `${lease}/pay` };
    case "RENEWAL_WINDOW": {
      const date = endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
      return {
        tone: "action",
        label: "Next step",
        title: "Your renewal window is open",
        body: amount && termMonths
          ? "Pay :amount for the next :months-month term before :date. It counts as paid only after RentFlow confirms it."
          : "Pay the full-term amount for the next term before :date. It counts as paid only after RentFlow confirms it.",
        bodyParams: amount && termMonths ? { amount, months: termMonths, date } : { date },
        action: "Pay renewal",
        href: `${lease}/renew`,
      };
    }
    case "GRACE":
      return {
        tone: "warning",
        label: "Action needed",
        title: "Your term is in grace",
        body: "Renewal requires the full-term amount. A payment is confirmed only after provider verification. Contact your property administrator if you need renewal support.",
        action: "Renew now",
        href: `${lease}/renew`,
      };
    case "EXPIRED":
    case "TERMINATED":
      return { tone: "warning", label: "Lease ended", title: "Your lease term has ended", body: "Please contact your property administrator about the next steps.", action: "Open lease", href: lease };
    case "RENEWED":
    case "ACTIVE":
    default:
      if (obligation === "PAID") {
        return { tone: "resolved", label: "Receipt available", title: "Lease payment confirmed", body: "RentFlow verified the exact full-term amount. Your receipt is the payment evidence.", action: "Open receipts", href: "/app/receipts" };
      }
      return {
        tone: "resolved",
        label: "Your lease",
        title: leaseCountdown(endDate, now).days > 14 ? "Your lease is active" : "Your term ends soon",
        body: "The amount is fixed. Pending is not paid until RentFlow confirms.",
        action: "Open lease",
        href: lease,
      };
  }
}

function startOfDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export type RailStop = { label: string; date: Date; state: "done" | "current" | "upcoming" };

/** Term progress and the Laravel lease rail: start → renewal opens (T-14) → term ends → grace ends (T+7). */
export function leaseRail(startDate: Date, endDate: Date, now: Date): { progress: number; stops: RailStop[] } {
  const total = endDate.getTime() - startDate.getTime();
  const progress = total > 0 ? Math.round(Math.min(1, Math.max(0, (now.getTime() - startDate.getTime()) / total)) * 100) : 100;
  const points = [
    { label: "Start", date: startDate },
    { label: "Renewal opens", date: new Date(endDate.getTime() - 14 * DAY) },
    { label: "Term ends", date: endDate },
    { label: "Grace ends", date: new Date(endDate.getTime() + 7 * DAY) },
  ];
  const lastPassed = points.reduce((index, point, i) => (point.date.getTime() <= now.getTime() ? i : index), -1);
  return {
    progress,
    stops: points.map((point, i) => ({ ...point, state: i < lastPassed ? "done" : i === lastPassed ? "current" : "upcoming" })),
  };
}
