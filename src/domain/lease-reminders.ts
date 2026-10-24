/**
 * Daily lease reminders, mirroring Laravel `App\Domain\Leases\SendLeaseReminders`.
 * One reminder per lease and template (dedupe key `template:leaseId`), so the job is safe to re-run.
 */

export type ReminderTemplate = "renewal_open" | "term_ending" | "grace_started" | "grace_ending";

const DAY = 24 * 60 * 60 * 1000;
export const GRACE_DAYS = 7;
/** Africa/Dar_es_Salaam is UTC+3 all year (no daylight saving). */
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Calendar day in East Africa Time, as a UTC-midnight timestamp. */
export function eatDay(instant: Date): number {
  const shifted = new Date(instant.getTime() + EAT_OFFSET_MS);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

/** Lease end dates are stored as calendar dates; read them without a timezone shift. */
function calendarDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function reminderFor(status: string, endDate: Date, now: Date): ReminderTemplate | null {
  const today = eatDay(now);
  const end = calendarDay(endDate);
  const graceDeadline = end + GRACE_DAYS * DAY;
  if (status === "RENEWAL_WINDOW") return today === end - DAY ? "term_ending" : "renewal_open";
  if (status === "GRACE") return today >= graceDeadline ? "grace_ending" : "grace_started";
  return null;
}

export function reminderDedupeKey(template: ReminderTemplate, leaseId: string) {
  return `${template}:${leaseId}`;
}

const fmt = (day: number) => new Date(day).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/** Wording follows Laravel `lang/en/sms.php`. */
export function reminderMessage(template: ReminderTemplate, input: { organization: string; unit: string; endDate: Date; amount: string }) {
  const end = calendarDay(input.endDate);
  const prefix = `RentFlow (${input.organization}):`;
  switch (template) {
    case "renewal_open":
      return { subject: "Your renewal window is open", body: `${prefix} your lease for ${input.unit} ends on ${fmt(end)}. Renew for the next term: ${input.amount}.` };
    case "term_ending":
      return { subject: "Your lease ends tomorrow", body: `${prefix} your lease for ${input.unit} ends tomorrow, ${fmt(end)}. Renew now: ${input.amount}.` };
    case "grace_started":
      return { subject: "Your lease is in grace", body: `${prefix} your lease for ${input.unit} has ended. Grace runs to ${fmt(end + GRACE_DAYS * DAY)}. Renew or contact the office.` };
    case "grace_ending":
      return { subject: "Grace ends today", body: `${prefix} grace for ${input.unit} ends today. Renew or contact the office today, or the lease expires.` };
  }
}
