import { describe, expect, it } from "vitest";
import { makeTossHoldings, mapTossAccount } from "./mapper";
import { flexibleDouble, type TossHoldingsOverview } from "./models";

describe("flexibleDouble", () => {
  it("parses string with comma separators or number", () => {
    expect(flexibleDouble("1,234.5")).toBeCloseTo(1234.5, 3);
    expect(flexibleDouble(42.0)).toBeCloseTo(42, 3);
    expect(flexibleDouble("not-a-number")).toBe(0);
    expect(flexibleDouble(null)).toBe(0);
  });
});

// 토스 /api/v1/holdings 응답(국내+해외 통합). currency/marketCountry 로 구분.
const overview: TossHoldingsOverview = {
  items: [
    {
      symbol: "005930",
      name: "삼성전자",
      quantity: "10",
      averagePurchasePrice: "70000",
      lastPrice: "80000",
      currency: "KRW",
      marketCountry: "KR",
    },
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      quantity: "5",
      averagePurchasePrice: "150",
      lastPrice: "200",
      currency: "USD",
      marketCountry: "US",
    },
  ],
};

describe("makeTossHoldings", () => {
  it("marketCountry/currency 로 국내·해외를 구분한다", () => {
    const holdings = makeTossHoldings(overview);
    expect(holdings).toHaveLength(2);

    const kr = holdings.find((h) => h.symbol === "005930")!;
    expect(kr.market).toBe("krStock");
    expect(kr.currency).toBe("krw");
    expect(kr.quantity * kr.currentPrice).toBeCloseTo(800_000, 3);

    const us = holdings.find((h) => h.symbol === "AAPL")!;
    expect(us.market).toBe("usStock");
    expect(us.currency).toBe("usd");
    expect(us.averageCost).toBe(150);
  });

  it("수량 0 이하는 제외한다", () => {
    const z: TossHoldingsOverview = {
      items: [
        {
          symbol: "X",
          name: "x",
          quantity: "0",
          averagePurchasePrice: "1",
          lastPrice: "1",
          currency: "KRW",
          marketCountry: "KR",
        },
      ],
    };
    expect(makeTossHoldings(z)).toHaveLength(0);
  });
});

describe("mapTossAccount", () => {
  it("토스 계좌로 묶는다", () => {
    const account = mapTossAccount(overview, "토스증권 12345678");
    expect(account.broker).toBe("tossSecurities");
    expect(account.accountType).toBe("general");
    expect(account.name).toBe("토스증권 12345678");
    expect(account.holdings).toHaveLength(2);
  });
});
