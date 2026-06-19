// iOS InvestAppCore/Domain/UseCases/ProfitAnalysisUseCase.swift 포팅.

import {
  type Holding,
  costBasisKRW,
  profitLossKRW,
  profitLossRate,
} from "../domain/holding";
import {
  type AssetSnapshot,
  snapshotProfit,
} from "../domain/snapshot";
import { type AnalysisPeriod, dateRange } from "../domain/analysisPeriod";
import type { HoldingProfit, ProfitSummary } from "./types";

/**
 * 기간 기반 손익 분석.
 * - today / total 은 보유 종목의 평가손익을 그대로 집계한다.
 * - week / month / quarter / year 는 스냅샷 델타로 계산하며, 스냅샷이 없으면 평가손익으로 폴백.
 */
export function profitAnalysis(
  holdings: Holding[],
  snapshots: AssetSnapshot[],
  period: AnalysisPeriod,
  usdToKrw: number,
  now: Date = new Date(),
): ProfitSummary {
  const breakdown = makeBreakdown(holdings, usdToKrw);

  const evalFallback = (): ProfitSummary => {
    const total = breakdown.reduce((s, b) => s + b.profitKRW, 0);
    const basis = holdings.reduce((s, h) => s + costBasisKRW(h, usdToKrw), 0);
    const rate = basis !== 0 ? (total / basis) * 100 : 0;
    return { totalProfitLoss: total, profitLossRate: rate, breakdown };
  };

  switch (period) {
    case "today":
    case "total":
      return evalFallback();
    default: {
      const delta = snapshotDelta(snapshots, period, now);
      if (delta) {
        return {
          totalProfitLoss: delta.amount,
          profitLossRate: delta.rate,
          breakdown,
        };
      }
      return evalFallback();
    }
  }
}

function makeBreakdown(holdings: Holding[], usdToKrw: number): HoldingProfit[] {
  return holdings
    .map((h) => ({
      id: h.id,
      symbol: h.symbol,
      name: h.name,
      profitKRW: profitLossKRW(h, usdToKrw),
      profitRate: profitLossRate(h),
    }))
    .sort((a, b) => b.profitKRW - a.profitKRW);
}

/** 기간 시작점 이후 첫 스냅샷과 마지막 스냅샷의 손익(profit) 차이. */
function snapshotDelta(
  snapshots: AssetSnapshot[],
  period: AnalysisPeriod,
  now: Date,
): { amount: number; rate: number } | null {
  if (snapshots.length === 0) return null;
  const range = dateRange(period, now);
  if (!range) return null;

  const inRange = snapshots
    .filter((s) => s.date >= range.start && s.date <= range.end)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  if (inRange.length === 0) return null;

  const first = inRange[0];
  const last = inRange[inRange.length - 1];
  const amount = snapshotProfit(last) - snapshotProfit(first);
  const rate = first.principal !== 0 ? (amount / first.principal) * 100 : 0;
  return { amount, rate };
}
