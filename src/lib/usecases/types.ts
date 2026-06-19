// Presentation 레이어에 흩어져 있던 결과 타입들을 모아 정의.
// (iOS: AnalysisViewModel / PortfolioViewModel 내 정의 → 웹에서는 usecase 결과 타입으로 통합)

/** 종목별 손익 요약. */
export interface HoldingProfit {
  id: string;
  symbol: string;
  name: string;
  profitKRW: number;
  profitRate: number;
}

/** 기간별 손익 요약. */
export interface ProfitSummary {
  totalProfitLoss: number; // 총 손익 (KRW)
  profitLossRate: number; // 총 수익률(%)
  breakdown: HoldingProfit[]; // 종목별 손익 (금액 내림차순)
}

/** 포트폴리오 비중 분류 기준. */
export type WeightDimension =
  | "account"
  | "holding"
  | "type"
  | "country"
  | "exchange";

/** 비중 조각. */
export interface WeightSlice {
  label: string;
  valueKRW: number;
  percent: number;
}

/** 전체 자산 집계 결과. */
export interface TotalAssets {
  totalValue: number; // 총 평가금액 (KRW)
  principal: number; // 총 매수원금 (KRW)
  totalProfitLoss: number; // 누적 평가손익 (KRW)
  totalProfitLossRate: number; // 누적 수익률(%)
  todayProfitLoss: number; // 보유 종목 평가손익 합계 (KRW)
}
