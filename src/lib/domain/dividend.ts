// 도메인 모델 — iOS InvestAppCore/Domain/Models/DividendSchedule.swift 포팅.

/** 배당 일정 1건. */
export interface DividendSchedule {
  id: string;
  symbol: string; // "AAPL"
  exDividendDate: Date; // 배당락일
  paymentDate: Date; // 지급일
  amountPerShare: number; // 1주당 배당금 (USD)
  totalAmount: number; // 총 배당금 (KRW)
  isConfirmed: boolean; // 확정 여부 (예정 vs 확정)
}
