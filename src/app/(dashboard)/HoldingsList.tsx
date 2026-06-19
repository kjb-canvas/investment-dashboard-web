"use client";

import { useState } from "react";
import type { Holding } from "@/lib/domain/holding";
import {
  evaluatedValueKRW,
  costBasisKRW,
  profitLossKRW,
  profitLossRate,
} from "@/lib/domain/holding";
import {
  formattedKRW,
  formattedSignedKRW,
  formattedPercent,
  profitColorClass,
} from "@/lib/format";

type SortMode = "profitAmount" | "profitRate" | "manual";
type ValuationMode = "market" | "book";

const SORTS: { id: SortMode; label: string }[] = [
  { id: "profitAmount", label: "총수익" },
  { id: "profitRate", label: "수익률" },
  { id: "manual", label: "직접설정" },
];

export function HoldingsList({
  holdings,
  usdToKrw,
}: {
  holdings: Holding[];
  usdToKrw: number;
}) {
  const [sort, setSort] = useState<SortMode>("profitAmount");
  const [valuation, setValuation] = useState<ValuationMode>("market");

  const sorted = [...holdings].sort((a, b) => {
    if (sort === "profitRate") return profitLossRate(b) - profitLossRate(a);
    if (sort === "manual") return 0;
    return profitLossKRW(b, usdToKrw) - profitLossKRW(a, usdToKrw);
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                sort === s.id
                  ? "bg-neutral-200 text-neutral-900"
                  : "border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setValuation(valuation === "market" ? "book" : "market")}
          className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          {valuation === "market" ? "시세" : "평가"}
        </button>
      </div>

      <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
        {sorted.map((h) => {
          const value =
            valuation === "market"
              ? evaluatedValueKRW(h, usdToKrw)
              : costBasisKRW(h, usdToKrw);
          const pl = profitLossKRW(h, usdToKrw);
          const rate = profitLossRate(h);
          return (
            <div key={h.id} className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{h.name}</div>
                <div className="text-xs text-neutral-500">
                  {h.symbol} · {h.quantity.toLocaleString("ko-KR")}주
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">{formattedKRW(value)}</div>
                <div className={`text-xs ${profitColorClass(pl)}`}>
                  {formattedSignedKRW(pl)} ({formattedPercent(rate)})
                </div>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="p-6 text-center text-sm text-neutral-500">
            보유 종목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
