import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("csv export", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv(["Name", "Note"], [["Ocean View, A2", 'Said "hi"\nok']])).toBe('Name,Note\r\n"Ocean View, A2","Said ""hi""\nok"\r\n');
  });

  it("neutralises spreadsheet formulas but keeps numbers", () => {
    expect(toCsv(["v"], [["=HYPERLINK(1)"], ["-5"], [-5], [null]])).toBe("v\r\n'=HYPERLINK(1)\r\n'-5\r\n-5\r\n\r\n");
  });
});
