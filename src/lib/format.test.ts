import { describe, it, expect } from "vitest";
import { formattedKRW, formattedSignedKRW, formattedPercent } from "./format";

describe("format", () => {
  it("KRW 그룹 구분 + 원", () => {
    expect(formattedKRW(279149692)).toBe("279,149,692원");
    expect(formattedKRW(1000)).toBe("1,000원");
  });

  it("부호 포함 KRW", () => {
    expect(formattedSignedKRW(32323665)).toBe("+32,323,665원");
    expect(formattedSignedKRW(-1000)).toBe("-1,000원");
  });

  it("부호 포함 퍼센트", () => {
    expect(formattedPercent(13.1)).toBe("+13.10%");
    expect(formattedPercent(-5.3)).toBe("-5.30%");
    expect(formattedPercent(0)).toBe("+0.00%");
  });
});
