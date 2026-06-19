// iOS InvestAppCore/Domain/UseCases/DividendUseCase.swift 포팅.
// 모든 집계는 paymentDate(지급일)의 연도를 기준으로 필터링하며, 금액은 totalAmount(KRW)를 사용.

import type { DividendSchedule } from "../domain/dividend";

/** 지정 연도의 연간 총 배당금 (KRW). */
export function annualDividendTotal(
  schedules: DividendSchedule[],
  year: number,
): number {
  return schedules
    .filter((s) => s.paymentDate.getFullYear() === year)
    .reduce((sum, s) => sum + s.totalAmount, 0);
}

/** 지정 연도의 월별 총 배당금 (KRW). 키는 1..12, 배당이 없는 달은 0. */
export function monthlyDividendTotals(
  schedules: DividendSchedule[],
  year: number,
): Record<number, number> {
  const totals: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) totals[m] = 0;
  for (const s of schedules) {
    if (s.paymentDate.getFullYear() !== year) continue;
    const month = s.paymentDate.getMonth() + 1;
    totals[month] += s.totalAmount;
  }
  return totals;
}

/** 배당수익률(%). 연간 배당(KRW) / 투자원금(KRW) * 100. 원금이 0이면 0. */
export function dividendYield(annualKRW: number, investedKRW: number): number {
  if (investedKRW === 0) return 0;
  return (annualKRW / investedKRW) * 100;
}
