import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without type declarations
import { collect, render } from "../../scripts/extract-client-phrases.mjs";
import { readFileSync } from "node:fs";

describe("client phrase extraction", () => {
  it("is up to date (run `node scripts/extract-client-phrases.mjs`)", () => {
    const current = readFileSync(new URL("./client-phrases.generated.ts", import.meta.url), "utf8");
    expect(current).toBe(render(collect()));
  });
});

describe("Swahili coverage", () => {
  it("translates every phrase the UI passes to t()", async () => {
    const { readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    // @ts-expect-error plain ESM script without type declarations
    const { extract } = await import("../../scripts/extract-client-phrases.mjs");
    const catalog = { ...(await import("./sw.extra.json")).default, ...(await import("./sw.json")).default } as Record<string, string>;
    const { clientPhrases } = await import("./client-phrases");
    const used = new Set<string>(clientPhrases());
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx?$/.test(name) && !name.endsWith(".test.ts")) for (const phrase of extract(readFileSync(path, "utf8")) as Set<string>) used.add(phrase);
      }
    };
    walk(new URL("..", import.meta.url).pathname);
    const missing = [...used].filter((phrase) => !catalog[phrase]);
    expect(missing).toEqual([]);
  });
});

describe("domain wording coverage", () => {
  it("translates every tenant journey sentence", async () => {
    const { tenantNextStep, leaseCountdown, leaseRail } = await import("../domain/tenant-journey");
    const catalog = { ...(await import("./sw.extra.json")).default, ...(await import("./sw.json")).default } as Record<string, string>;
    const now = new Date("2026-10-24T09:00:00Z");
    const end = new Date("2026-11-05T00:00:00Z");
    const statuses = ["DRAFT", "AWAITING_PAYMENT", "ACTIVE", "RENEWAL_WINDOW", "GRACE", "RENEWED", "EXPIRED", "TERMINATED"] as const;
    const phrases = new Set<string>();
    for (const status of statuses) for (const obligation of [null, "PENDING", "PAID", "EXCEPTION"] as const) for (const extra of [{}, { amount: "TZS 1", termMonths: 6 }]) {
      const step = tenantNextStep({ leaseId: "L", status, obligation, endDate: end, now, ...extra });
      [step.label, step.title, step.body, step.action].forEach((value) => phrases.add(value));
    }
    for (const offset of [-5, -1, 0, 1, 5, 10, 30]) phrases.add(leaseCountdown(new Date(now.getTime() + offset * 86_400_000), now).label);
    leaseRail(new Date("2026-05-05T00:00:00Z"), end, now).stops.forEach((stop) => phrases.add(stop.label));
    expect([...phrases].filter((phrase) => !catalog[phrase])).toEqual([]);
  });
});
