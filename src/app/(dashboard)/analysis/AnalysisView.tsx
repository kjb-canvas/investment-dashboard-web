"use client";

import { useMemo, useState } from "react";
import type { Holding } from "@/lib/domain/holding";
import type { AssetSnapshot } from "@/lib/domain/snapshot";
import {
  type AnalysisPeriod,
  ALL_PERIODS,
  periodDisplayName,
} from "@/lib/domain/analysisPeriod";
import { profitAnalysis } from "@/lib/usecases/profitAnalysis";
import {
  formattedSignedKRW,
  formattedPercent,
  profitColorClass,
} from "@/lib/format";

/** 서버→클라이언트 전달용 스냅샷 DTO. date 는 ISO 문자열로 직렬화. */
export interface SnapshotDTO {
  id: string;
  date: string;
  totalValue: number;
  principal: number;
}

export function AnalysisView({
  holdings,
  snapshots,
  usdToKrw,
}: {
  holdings: Holding[];
  snapshots: SnapshotDTO[];
  usdToKrw: number;
}) {
  const [period, setPeriod] = useState<AnalysisPeriod>("total");

  const restored = useMemo<AssetSnapshot[]>(
    () =>
      snapshots.map((s) => ({
        id: s.id,
        date: new Date(s.date),
        totalValue: s.totalValue,
        principal: s.principal,
      })),
    [snapshots],
  );

  const summary = useMemo(
    () => profitAnalysis(holdings, restored, period, usdToKrw),
    [holdings, restored, period, usdToKrw],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {ALL_PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`min-h-9 rounded-full px-3 py-1.5 text-sm ${
              period === p
                ? "bg-neutral-200 text-neutral-900"
                : "border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            {periodDisplayName(p)}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6">
        <div className="text-sm text-neutral-400">
          {periodDisplayName(period)} 손익
        </div>
        <div
          className={`mt-1 text-3xl font-bold ${profitColorClass(
            summary.totalProfitLoss,
          )}`}
        >
          {formattedSignedKRW(summary.totalProfitLoss)}
        </div>
        <div
          className={`mt-2 text-sm ${profitColorClass(summary.totalProfitLoss)}`}
        >
          {formattedPercent(summary.profitLossRate)}
        </div>
      </div>

      <div className="mb-2 text-sm text-neutral-400">종목별 손익</div>
      <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
        {summary.breakdown.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{b.name}</div>
              <div className="truncate text-xs text-neutral-500">{b.symbol}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className={`text-sm ${profitColorClass(b.profitKRW)}`}>
                {formattedSignedKRW(b.profitKRW)}
              </div>
              <div className={`text-xs ${profitColorClass(b.profitKRW)}`}>
                {formattedPercent(b.profitRate)}
              </div>
            </div>
          </div>
        ))}
        {summary.breakdown.length === 0 && (
          <div className="p-6 text-center text-sm text-neutral-500">
            보유 종목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
