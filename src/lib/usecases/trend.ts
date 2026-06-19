// iOS InvestAppCore/Domain/UseCases/TrendUseCase.swift 포팅.

import type { AssetSnapshot } from "../domain/snapshot";
import { type AnalysisPeriod, dateRange } from "../domain/analysisPeriod";

/** 기간으로 필터링하고 날짜 오름차순 정렬한 스냅샷 시계열. */
export function trendSeries(
  snapshots: AssetSnapshot[],
  period: AnalysisPeriod,
  now: Date = new Date(),
): AssetSnapshot[] {
  const sorted = [...snapshots].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const range = dateRange(period, now);
  if (!range) return sorted; // total
  return sorted.filter((s) => s.date >= range.start && s.date <= range.end);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 지정 날짜의 자산 평가금액(KRW).
 * 같은 날 스냅샷이 있으면 그 값을, 없으면 그 날짜 이하 가장 최근 스냅샷 값을 반환. 없으면 null.
 */
export function trendValueAt(
  date: Date,
  snapshots: AssetSnapshot[],
): number | null {
  const exact = snapshots.find((s) => isSameDay(s.date, date));
  if (exact) return exact.totalValue;

  const before = snapshots
    .filter((s) => s.date <= date)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  if (before.length === 0) return null;
  return before[before.length - 1].totalValue;
}
