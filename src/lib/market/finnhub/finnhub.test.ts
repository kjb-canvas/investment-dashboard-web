// Finnhub 순수 매퍼 단위 테스트 — iOS FinnhubTests.swift 픽스처 포팅 (네트워크 없음).

import { describe, it, expect } from "vitest";
import {
  mapQuote,
  mapDividends,
  parseUtcDate,
  formatUtcDate,
  type FinnhubQuoteDTO,
  type FinnhubDividendDTO,
} from "./mapper";

describe("mapQuote", () => {
  it("decodes current price from `c` field", () => {
    // FinnhubTests: {"c":200.15,"h":201,"l":199,"o":200,"pc":198}
    const dto: FinnhubQuoteDTO = { c: 200.15 };
    const quote = mapQuote("AAPL", dto);
    expect(quote.symbol).toBe("AAPL");
    expect(quote.price).toBeCloseTo(200.15, 3);
  });
});

describe("mapDividends", () => {
  it("maps to schedule with zero total and parsed dates", () => {
    // FinnhubTests: [{"symbol":"AAPL","date":"2025-02-07","payDate":"2025-02-13","amount":0.24}]
    const dtos: FinnhubDividendDTO[] = [
      { symbol: "AAPL", date: "2025-02-07", payDate: "2025-02-13", amount: 0.24 },
    ];
    const schedules = mapDividends(dtos);
    expect(schedules).toHaveLength(1);
    const s = schedules[0];
    expect(s.symbol).toBe("AAPL");
    expect(s.amountPerShare).toBeCloseTo(0.24, 4);
    expect(s.totalAmount).toBe(0);
    expect(s.isConfirmed).toBe(true);
    expect(s.exDividendDate.getTime()).toBe(parseUtcDate("2025-02-07").getTime());
    expect(s.paymentDate.getTime()).toBe(parseUtcDate("2025-02-13").getTime());
    expect(s.id).toMatch(/[0-9a-f-]{36}/);
  });

  it("handles empty array", () => {
    expect(mapDividends([])).toEqual([]);
  });

  it("falls back payDate to exDate when payDate invalid", () => {
    const dtos: FinnhubDividendDTO[] = [
      { symbol: "MSFT", date: "2025-03-01", payDate: "not-a-date", amount: 0.5 },
    ];
    const [s] = mapDividends(dtos);
    expect(s.paymentDate.getTime()).toBe(parseUtcDate("2025-03-01").getTime());
  });
});

describe("date helpers", () => {
  it("parseUtcDate parses yyyy-MM-dd as UTC midnight", () => {
    const d = parseUtcDate("2025-02-07");
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(1); // 0-based Feb
    expect(d.getUTCDate()).toBe(7);
    expect(d.getUTCHours()).toBe(0);
  });

  it("formatUtcDate round-trips with parseUtcDate", () => {
    expect(formatUtcDate(parseUtcDate("2025-01-01"))).toBe("2025-01-01");
    expect(formatUtcDate(parseUtcDate("2025-12-31"))).toBe("2025-12-31");
  });
});
