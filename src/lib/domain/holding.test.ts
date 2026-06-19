import { describe, it, expect } from "vitest";
import {
  type Holding,
  evaluatedValue,
  costBasis,
  profitLoss,
  profitLossRate,
  evaluatedValueKRW,
} from "./holding";

function makeHolding(partial: Partial<Holding> = {}): Holding {
  return {
    id: "1",
    symbol: "AAPL",
    name: "Apple",
    market: "usStock",
    quantity: 10,
    averageCost: 100,
    currentPrice: 150,
    currency: "usd",
    ...partial,
  };
}

describe("Holding 계산", () => {
  it("평가금액·원금·손익·수익률", () => {
    const h = makeHolding();
    expect(evaluatedValue(h)).toBe(1500);
    expect(costBasis(h)).toBe(1000);
    expect(profitLoss(h)).toBe(500);
    expect(profitLossRate(h)).toBeCloseTo(50);
  });

  it("원금 0이면 수익률 0", () => {
    const h = makeHolding({ averageCost: 0 });
    expect(profitLossRate(h)).toBe(0);
  });

  it("USD 보유는 환율로 KRW 환산", () => {
    const h = makeHolding();
    expect(evaluatedValueKRW(h, 1300)).toBe(1500 * 1300);
  });

  it("KRW 보유는 환율 무시", () => {
    const h = makeHolding({ currency: "krw" });
    expect(evaluatedValueKRW(h, 1300)).toBe(1500);
  });
});
