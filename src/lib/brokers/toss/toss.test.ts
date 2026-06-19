import { describe, expect, it } from "vitest";
import {
  makeTossDomesticHoldings,
  makeTossOverseasHoldings,
  mapTossAccount,
} from "./mapper";
import {
  type TossDomesticBalanceResponse,
  type TossOverseasBalanceResponse,
  flexibleDouble,
} from "./models";

describe("flexibleDouble", () => {
  it("parses string with comma separators or number", () => {
    expect(flexibleDouble("1,234.5")).toBeCloseTo(1234.5, 3);
    expect(flexibleDouble(42.0)).toBeCloseTo(42, 3);
    expect(flexibleDouble("not-a-number")).toBe(0);
    expect(flexibleDouble(null)).toBe(0);
  });
});

describe("TossMapper.makeTossDomesticHoldings", () => {
  it("maps krStock/krw", () => {
    const response: TossDomesticBalanceResponse = {
      holdings: [
        {
          stock_code: "005930",
          stock_name: "삼성전자",
          balance_qty: "10",
          avg_buy_price: "70000",
          current_price: "80000",
        },
      ],
    };
    const holdings = makeTossDomesticHoldings(response);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].market).toBe("krStock");
    expect(holdings[0].currency).toBe("krw");
    // evaluatedValue = qty * currentPrice
    expect(holdings[0].quantity * holdings[0].currentPrice).toBeCloseTo(
      800_000,
      3,
    );
  });

  it("excludes zero quantity", () => {
    const response: TossDomesticBalanceResponse = {
      holdings: [
        {
          stock_code: "X",
          stock_name: "x",
          balance_qty: 0,
          avg_buy_price: 1,
          current_price: 1,
        },
      ],
    };
    expect(makeTossDomesticHoldings(response)).toHaveLength(0);
  });
});

describe("TossMapper.makeTossOverseasHoldings", () => {
  it("maps usStock/usd", () => {
    const response: TossOverseasBalanceResponse = {
      holdings: [
        {
          ticker: "AAPL",
          stock_name: "Apple Inc.",
          balance_qty: 5,
          avg_buy_price: 150,
          current_price: 200,
          currency: "USD",
        },
      ],
    };
    const holdings = makeTossOverseasHoldings(response);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].market).toBe("usStock");
    expect(holdings[0].currency).toBe("usd");
    expect(holdings[0].symbol).toBe("AAPL");
  });
});

describe("mapTossAccount", () => {
  it("merges domestic and overseas", () => {
    const domestic: TossDomesticBalanceResponse = {
      holdings: [
        {
          stock_code: "005930",
          stock_name: "삼성전자",
          balance_qty: "10",
          avg_buy_price: "70000",
          current_price: "80000",
        },
      ],
    };
    const overseas: TossOverseasBalanceResponse = {
      holdings: [
        {
          ticker: "AAPL",
          stock_name: "Apple Inc.",
          balance_qty: "5",
          avg_buy_price: "150",
          current_price: "200",
          currency: "USD",
        },
      ],
    };
    const account = mapTossAccount(domestic, overseas);
    expect(account.broker).toBe("tossSecurities");
    expect(account.accountType).toBe("general");
    expect(account.holdings).toHaveLength(2);
    expect(
      account.holdings.some(
        (h) => h.currency === "krw" && h.market === "krStock",
      ),
    ).toBe(true);
    expect(
      account.holdings.some(
        (h) => h.currency === "usd" && h.market === "usStock",
      ),
    ).toBe(true);
  });
});
