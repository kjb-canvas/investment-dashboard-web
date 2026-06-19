// 도메인 모델 — iOS InvestAppCore/Domain/Models/Holding.swift 포팅.
// 내부 계산은 원 통화(currency)로 유지하고, 화면 표시 직전에만 KRW 로 변환한다.

export type Broker =
  | "upbit" // 업비트 (코인)
  | "tossSecurities" // 토스증권
  | "kis" // 한국투자증권
  | "nhInvestment"; // NH투자증권 — Windows 브릿지 전제

export const ALL_BROKERS: Broker[] = [
  "upbit",
  "tossSecurities",
  "kis",
  "nhInvestment",
];

export type Market = "crypto" | "usStock" | "krStock";

export type Currency = "krw" | "usd";

/** 보유 종목 1건. */
export interface Holding {
  id: string;
  symbol: string; // "BTC", "AAPL", "005930"
  name: string;
  market: Market;
  quantity: number;
  averageCost: number; // 평균 매수가 (원 통화 기준)
  currentPrice: number; // 현재가 (원 통화 기준)
  currency: Currency;
}

/** 원 통화 기준 평가금액. */
export function evaluatedValue(h: Holding): number {
  return h.quantity * h.currentPrice;
}

/** 원 통화 기준 매수원금. */
export function costBasis(h: Holding): number {
  return h.quantity * h.averageCost;
}

/** 원 통화 기준 평가손익. */
export function profitLoss(h: Holding): number {
  return evaluatedValue(h) - costBasis(h);
}

/** 수익률(%). 원금이 0이면 0. */
export function profitLossRate(h: Holding): number {
  const cb = costBasis(h);
  if (cb === 0) return 0;
  return (profitLoss(h) / cb) * 100;
}

/**
 * 지정 환율로 변환한 KRW 평가금액.
 * currency 가 krw 면 환율 무시.
 */
export function evaluatedValueKRW(h: Holding, usdToKrw: number): number {
  switch (h.currency) {
    case "krw":
      return evaluatedValue(h);
    case "usd":
      return evaluatedValue(h) * usdToKrw;
  }
}

/** 환율 적용 평가손익(KRW). */
export function profitLossKRW(h: Holding, usdToKrw: number): number {
  return h.currency === "usd" ? profitLoss(h) * usdToKrw : profitLoss(h);
}

/** 환율 적용 매수원금(KRW). */
export function costBasisKRW(h: Holding, usdToKrw: number): number {
  return h.currency === "usd" ? costBasis(h) * usdToKrw : costBasis(h);
}
