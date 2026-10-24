import { describe, expect, it } from "vitest";
import catalog from "./sw.json";
import { createTranslator, fill, normalizeLocale, plural } from "./translate";

const sw = createTranslator("sw", catalog as Record<string, string>);

describe("translation", () => {
  it("translates Laravel catalog sentences and keeps unknown text in English", () => {
    expect(sw("Home")).toBe("Nyumbani");
    expect(sw("A sentence nobody translated")).toBe("A sentence nobody translated");
    expect(createTranslator("en", catalog as Record<string, string>)("Home")).toBe("Home");
  });

  it("fills placeholders without clobbering longer names", () => {
    expect(fill(":count of :counter", { count: 2, counter: "x" })).toBe("2 of x");
  });

  it("picks singular or plural before translating", () => {
    const en = createTranslator("en", {});
    expect(plural(en, 1, "1 space", ":count spaces")).toBe("1 space");
    expect(plural(en, 3, "1 space", ":count spaces")).toBe("3 spaces");
  });

  it("only accepts supported locales", () => {
    expect(normalizeLocale("sw")).toBe("sw");
    expect(normalizeLocale("fr")).toBe("en");
  });
});
