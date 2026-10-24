import { describe, expect, it } from "vitest";
import { localTanzaniaPhone, maskTanzaniaPhone, normalizeTanzaniaPhone } from "./phone";

describe("Tanzania phone normalization", () => {
  it("normalizes local phone numbers", () => {
    expect(normalizeTanzaniaPhone("0712 345 678")).toBe("255712345678");
  });

  it("accepts international numbers with plus", () => {
    expect(normalizeTanzaniaPhone("+255712345678")).toBe("255712345678");
  });

  it("normalizes nine-digit subscriber input", () => {
    expect(normalizeTanzaniaPhone("712345678")).toBe("255712345678");
  });

  it("rejects invalid phone numbers", () => {
    expect(() => normalizeTanzaniaPhone("12345")).toThrow("valid Tanzanian phone number");
  });

  it("renders local and masked forms without exposing the full number", () => {
    expect(localTanzaniaPhone("255712345678")).toBe("0712345678");
    expect(maskTanzaniaPhone("255712345678")).toBe("25571****678");
  });
});
