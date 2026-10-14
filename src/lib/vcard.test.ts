import { describe, it, expect } from "vitest";
import { sanitize, formatNumber, isValidLength, buildName, processInput, extractCandidate, type Options } from "./vcard";

const base: Options = { prefix: "1", counter: true, startIndex: 1, separator: "_", pad: 0, mode: "original", countryCode: "", dedupe: true };

describe("vcard engine", () => {
  it("strips non-digits but keeps leading +", () => {
    expect(sanitize(" (077) 123-4567 ")).toBe("0771234567");
    expect(sanitize("+94 77 123 4567")).toBe("+94771234567");
  });
  it("extracts phone cell from messy spreadsheet rows", () => {
    expect(extractCandidate('"John",\t"077-123-4567",')).toBe("077-123-4567");
  });
  it("converts Sri Lankan 07 numbers to +947", () => {
    expect(formatNumber("0771234567", "lk")).toBe("+94771234567");
  });
  it("custom country code drops leading zero", () => {
    expect(formatNumber("0412345678", "custom", "61")).toBe("+61412345678");
  });
  it("valid length is 9-15 digits", () => {
    expect(isValidLength("12345678")).toBe(false);
    expect(isValidLength("123456789")).toBe(true);
    expect(isValidLength("1234567890123456")).toBe(false);
  });
  it("builds sequential names", () => {
    expect(buildName(base, 0)).toBe("1_1");
    expect(buildName({ ...base, separator: "-", pad: 3 }, 0)).toBe("1 - 001");
  });
  it("drops duplicates and invalids, uses CRLF", () => {
    const r = processInput("0771234567\n0771234567\n123", base);
    expect(r.stats).toEqual({ total: 3, valid: 1, invalid: 1, duplicates: 1 });
    expect(r.vcf).toBe("BEGIN:VCARD\r\nVERSION:3.0\r\nFN:1_1\r\nN:;1_1;;;\r\nTEL;TYPE=CELL:0771234567\r\nEND:VCARD\r\n");
  });
});
