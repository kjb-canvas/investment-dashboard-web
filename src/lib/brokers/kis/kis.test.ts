import { describe, expect, it } from "vitest";
import {
  makeKISDomesticHoldings,
  makeKISOverseasHoldings,
  mapKISAccount,
} from "./mapper";
import type {
  KISDomesticBalanceResponse,
  KISOverseasBalanceResponse,
} from "./models";

describe("KISMapper.makeKISDomesticHoldings", () => {
  it("parses string numbers into krStock/krw holding", () => {
    const response: KISDomesticBalanceResponse = {
      rt_cd: "0",
      output1: [
        {
          pdno: "005930",
          prdt_name: "삼성전자",
          hldg_qty: "10",
          pchs_avg_pric: "70000",
          prpr: "80000",
        },
      ],
    };
    const holdings = makeKISDomesticHoldings(response);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].market).toBe("krStock");
    expect(holdings[0].currency).toBe("krw");
    expect(holdings[0].quantity).toBeCloseTo(10, 3);
    expect(holdings[0].currentPrice).toBeCloseTo(80000, 3);
    expect(holdings[0].averageCost).toBeCloseTo(70000, 3);
    expect(holdings[0].symbol).toBe("005930");
  });

  it("excludes zero quantity", () => {
    const response: KISDomesticBalanceResponse = {
      rt_cd: "0",
      output1: [
        {
          pdno: "X",
          prdt_name: "x",
          hldg_qty: "0",
          pchs_avg_pric: "1",
          prpr: "1",
        },
      ],
    };
    expect(makeKISDomesticHoldings(response)).toHaveLength(0);
  });
});

describe("KISMapper.makeKISOverseasHoldings", () => {
  it("maps US stock as usStock/usd", () => {
    const response: KISOverseasBalanceResponse = {
      rt_cd: "0",
      output1: [
        {
          ovrs_pdno: "AAPL",
          ovrs_item_name: "Apple",
          ovrs_cblc_qty: "5",
          pchs_avg_pric: "150",
          now_pric2: "200",
          tr_crcy_cd: "USD",
        },
      ],
    };
    const holdings = makeKISOverseasHoldings(response);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].market).toBe("usStock");
    expect(holdings[0].currency).toBe("usd");
    expect(holdings[0].symbol).toBe("AAPL");
  });
});

describe("mapKISAccount", () => {
  it("merges domestic and overseas holdings", () => {
    const domestic: KISDomesticBalanceResponse = {
      rt_cd: "0",
      output1: [
        {
          pdno: "005930",
          prdt_name: "삼성전자",
          hldg_qty: "10",
          pchs_avg_pric: "70000",
          prpr: "80000",
        },
      ],
    };
    const overseas: KISOverseasBalanceResponse = {
      rt_cd: "0",
      output1: [
        {
          ovrs_pdno: "AAPL",
          ovrs_item_name: "Apple",
          ovrs_cblc_qty: "5",
          pchs_avg_pric: "150",
          now_pric2: "200",
          tr_crcy_cd: "USD",
        },
      ],
    };
    const account = mapKISAccount(domestic, overseas);
    expect(account.broker).toBe("kis");
    expect(account.accountType).toBe("general");
    expect(account.holdings).toHaveLength(2);
    expect(account.holdings.some((h) => h.currency === "krw")).toBe(true);
    expect(account.holdings.some((h) => h.currency === "usd")).toBe(true);
  });

  it("handles missing output1", () => {
    const account = mapKISAccount({ rt_cd: "0" }, { rt_cd: "0" });
    expect(account.holdings).toHaveLength(0);
  });
});
