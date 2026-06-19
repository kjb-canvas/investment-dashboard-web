import { describe, it, expect } from "vitest";
import type { Account } from "../domain/account";
import type { Holding } from "../domain/holding";
import type { AssetSnapshot } from "../domain/snapshot";
import type { DividendSchedule } from "../domain/dividend";
import { fetchTotalAssets } from "./fetchTotalAssets";
import { profitAnalysis } from "./profitAnalysis";
import { portfolioWeights } from "./portfolioWeight";
import { trendSeries, trendValueAt } from "./trend";
import {
  annualDividendTotal,
  monthlyDividendTotals,
  dividendYield,
} from "./dividend";

const krwHolding: Holding = {
  id: "kr1",
  symbol: "005930",
  name: "삼성전자",
  market: "krStock",
  quantity: 10,
  averageCost: 60000,
  currentPrice: 70000,
  currency: "krw",
};

const usdHolding: Holding = {
  id: "us1",
  symbol: "AAPL",
  name: "Apple",
  market: "usStock",
  quantity: 5,
  averageCost: 100,
  currentPrice: 120,
  currency: "usd",
};

const account: Account = {
  id: "acc1",
  broker: "kis",
  accountType: "general",
  name: "위탁계좌",
  holdings: [krwHolding, usdHolding],
};

describe("fetchTotalAssets", () => {
  it("KRW 환산 총자산과 손익을 집계한다", () => {
    const rate = 1300;
    const res = fetchTotalAssets([account], rate);
    // KRW: 평가 700,000 / 원금 600,000
    // USD: 평가 600 * 1300 = 780,000 / 원금 500 * 1300 = 650,000
    expect(res.totalValue).toBe(700000 + 780000);
    expect(res.principal).toBe(600000 + 650000);
    expect(res.totalProfitLoss).toBe(res.totalValue - res.principal);
    expect(res.totalProfitLossRate).toBeCloseTo(
      (res.totalProfitLoss / res.principal) * 100,
    );
  });
});

describe("profitAnalysis", () => {
  it("today/total 은 평가손익을 집계한다", () => {
    const res = profitAnalysis([krwHolding], [], "total", 1300);
    expect(res.totalProfitLoss).toBe(100000); // (70000-60000)*10
    expect(res.breakdown).toHaveLength(1);
  });

  it("기간형은 스냅샷 델타로 계산한다", () => {
    const now = new Date("2026-06-19T00:00:00Z");
    const snapshots: AssetSnapshot[] = [
      {
        id: "s1",
        date: new Date("2026-06-15T00:00:00Z"),
        totalValue: 1000,
        principal: 900,
      },
      {
        id: "s2",
        date: new Date("2026-06-18T00:00:00Z"),
        totalValue: 1200,
        principal: 900,
      },
    ];
    const res = profitAnalysis([krwHolding], snapshots, "week", 1300, now);
    // profit delta = (1200-900) - (1000-900) = 200
    expect(res.totalProfitLoss).toBe(200);
  });

  it("스냅샷 없으면 평가손익으로 폴백한다", () => {
    const res = profitAnalysis([krwHolding], [], "week", 1300);
    expect(res.totalProfitLoss).toBe(100000);
  });
});

describe("portfolioWeights", () => {
  it("type 차원 비중 합은 100", () => {
    const slices = portfolioWeights([account], "type", 1300);
    const sum = slices.reduce((s, x) => s + x.percent, 0);
    expect(sum).toBeCloseTo(100);
  });

  it("내림차순 정렬", () => {
    const slices = portfolioWeights([account], "holding", 1300);
    for (let i = 1; i < slices.length; i++) {
      expect(slices[i - 1].percent).toBeGreaterThanOrEqual(slices[i].percent);
    }
  });
});

describe("trend", () => {
  const snaps: AssetSnapshot[] = [
    { id: "a", date: new Date("2026-06-01"), totalValue: 100, principal: 80 },
    { id: "b", date: new Date("2026-06-10"), totalValue: 120, principal: 80 },
  ];

  it("total 은 전체를 정렬해 반환", () => {
    expect(trendSeries(snaps, "total")).toHaveLength(2);
  });

  it("valueAt 은 해당 날짜 이하 최근 값", () => {
    expect(trendValueAt(new Date("2026-06-05"), snaps)).toBe(100);
    expect(trendValueAt(new Date("2026-06-15"), snaps)).toBe(120);
    expect(trendValueAt(new Date("2026-05-01"), snaps)).toBeNull();
  });
});

describe("dividend", () => {
  const schedules: DividendSchedule[] = [
    {
      id: "d1",
      symbol: "AAPL",
      exDividendDate: new Date("2026-02-01"),
      paymentDate: new Date("2026-02-15"),
      amountPerShare: 0.25,
      totalAmount: 10000,
      isConfirmed: true,
    },
    {
      id: "d2",
      symbol: "AAPL",
      exDividendDate: new Date("2026-05-01"),
      paymentDate: new Date("2026-05-15"),
      amountPerShare: 0.25,
      totalAmount: 10000,
      isConfirmed: false,
    },
    {
      id: "d3",
      symbol: "MSFT",
      exDividendDate: new Date("2025-11-01"),
      paymentDate: new Date("2025-11-15"),
      amountPerShare: 0.75,
      totalAmount: 30000,
      isConfirmed: true,
    },
  ];

  it("연간 총 배당은 해당 연도만 합산", () => {
    expect(annualDividendTotal(schedules, 2026)).toBe(20000);
    expect(annualDividendTotal(schedules, 2025)).toBe(30000);
  });

  it("월별 합계는 12개월 키를 갖는다", () => {
    const totals = monthlyDividendTotals(schedules, 2026);
    expect(Object.keys(totals)).toHaveLength(12);
    expect(totals[2]).toBe(10000);
    expect(totals[5]).toBe(10000);
    expect(totals[1]).toBe(0);
  });

  it("배당수익률", () => {
    expect(dividendYield(20000, 1000000)).toBeCloseTo(2);
    expect(dividendYield(20000, 0)).toBe(0);
  });
});
