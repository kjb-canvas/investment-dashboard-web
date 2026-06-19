// 도메인 모델 — iOS InvestAppCore/Domain/Models/AssetSnapshot.swift 포팅.
// 추이/기간별 수익 분석의 기반 데이터. 모든 금액은 KRW 기준.

/** 특정 시점의 자산 스냅샷. date 는 ISO 문자열(UTC) 또는 Date. */
export interface AssetSnapshot {
  id: string;
  date: Date;
  totalValue: number; // 총 평가금액 (KRW)
  principal: number; // 원금 (KRW)
}

/** 평가손익 (KRW). 평가금액 - 원금. */
export function snapshotProfit(s: AssetSnapshot): number {
  return s.totalValue - s.principal;
}

/** 수익률(%). 원금이 0이면 0. */
export function snapshotProfitRate(s: AssetSnapshot): number {
  if (s.principal === 0) return 0;
  return (snapshotProfit(s) / s.principal) * 100;
}
