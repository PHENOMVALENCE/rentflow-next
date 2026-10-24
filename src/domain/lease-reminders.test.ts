import { describe, expect, it } from "vitest";
import { eatDay, reminderDedupeKey, reminderFor, reminderMessage } from "./lease-reminders";

const end = new Date("2026-11-05T00:00:00Z");

describe("lease reminders", () => {
  it("uses East Africa Time for today", () => {
    // 22:30 UTC on 3 Nov is 01:30 EAT on 4 Nov.
    expect(eatDay(new Date("2026-11-03T22:30:00Z"))).toBe(Date.UTC(2026, 10, 4));
  });

  it("sends renewal_open in the window and term_ending the day before the end", () => {
    expect(reminderFor("RENEWAL_WINDOW", end, new Date("2026-10-25T05:00:00Z"))).toBe("renewal_open");
    expect(reminderFor("RENEWAL_WINDOW", end, new Date("2026-11-04T05:00:00Z"))).toBe("term_ending");
  });

  it("switches to grace_ending on the grace deadline (end + 7 days)", () => {
    expect(reminderFor("GRACE", end, new Date("2026-11-08T05:00:00Z"))).toBe("grace_started");
    expect(reminderFor("GRACE", end, new Date("2026-11-12T05:00:00Z"))).toBe("grace_ending");
  });

  it("ignores other states and keys one reminder per lease and template", () => {
    expect(reminderFor("ACTIVE", end, new Date("2026-10-01T05:00:00Z"))).toBeNull();
    expect(reminderDedupeKey("renewal_open", "L1")).toBe("renewal_open:L1");
  });

  it("formats the grace deadline in the message", () => {
    const message = reminderMessage("grace_started", { organization: "Acme", unit: "Ocean View A2", endDate: end, amount: "TZS 5,100,000" });
    expect(message.body).toContain("12/11/2026");
  });
});
